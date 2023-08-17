from fastapi import FastAPI, Body, HTTPException, Request, Response
from fastapi.responses import FileResponse
from pydantic import BaseModel
import gradio as gr

import os, io
import json
from PIL import Image
import re,base64
import copy
import time

from modules import localization
import modules.shared as shared
import modules.scripts as scripts
import modules.script_callbacks as script_callbacks
import modules.generation_parameters_copypaste as parameters_copypaste
from modules.generation_parameters_copypaste import paste_fields, registered_param_bindings
from scripts import lightflow_version 


workflow_json = {}
State_Comps = {} # 当前页面的按钮组件
invisible_buttons = {}
Webui_Comps = {} # webui上需要操作的图片组件
Webui_Comps_Cur_Val = [] # 顺序与ReturnKey一致
Return_Key = [
    "useless_Textbox", # 第一个组件是用来预计算第一张有效图的索引 防止出现有没用的页面跳转
    "img2img_image","img2img_sketch","img2maskimg","inpaint_sketch","img_inpaint_base","img_inpaint_mask"
    ] # 只操作图片相关参数，其他参数js里搞定
Output_Log = ""


def test_func():
    with open(shared.cmd_opts.ui_settings_file, mode='r', encoding='UTF-8') as f:
        json_str = f.read()
        config_json = json.loads(json_str)
        print(config_json['localization'])
        print(localization.localizations[config_json['localization']])


def add_output_log(msg:str, style:str=""):
    global Output_Log
    Output_Log += f'<p style="{style}">{msg}</p>'


'''
python触发导入事件，按正常逻辑先执行js代码，把除图片以外的参数全部设置好，然后回到python代码，读取图片保存到Webui_Comps_Cur_Val，再用json2js的onchange事件触发js来点击隐藏按钮开始触发设置图片的事件队列。
'''
def on_after_component(component, **kwargs):
    global temp_index,next_index
    #if isinstance(component, gr.Image):
    try:
        if(Webui_Comps.get(kwargs["elem_id"], None) == None):
            Webui_Comps[kwargs["elem_id"]] = component
    except BaseException as e:
        pass
        #print(e)

    if (isinstance(component, gr.Button) and kwargs["elem_id"] == "change_checkpoint"): # 加载到最后一个组件了
        print("开始绑定按钮")


        target_comps = []
        # for key in Return_Key:
        #     try:
        #         target_comps.append(Webui_Comps[key])
        #     except:
        #         print(f"elem_id {key} is doesn't exist")

        target_comps.append(State_Comps["json2js"]) # 触发事件传递json给js
        target_comps.append(State_Comps["outlog"][0])
        target_comps.append(State_Comps["outlog"][1]) # 因为显示日志的窗口分txt2img和img2img两个位置 所以两个位置同步导出
        print(target_comps)

        for btn in State_Comps["export"]:
            btn.click(None,_js="state.core.actions.exportState") #, inputs=[],outputs=[] 

        for btn in State_Comps["import"]:
            btn.upload(fn_import_workflow, _js=f"state.core.actions.importLightflow",inputs=[btn],outputs=target_comps) # js里加载除图片以外的参数 python加载图片

        State_Comps["json2js"].change(fn=None,_js="state.core.actions.startImportImage",inputs=[State_Comps["json2js"]])
        
        State_Comps["test_button"].click(test_func,_js="state.utils.testFunction",inputs=[])

        print(f"invisible_buttons: ")
        for key in invisible_buttons.keys():
            segs = key.split("_")
            comp_name = "_".join(segs[2:])
            print(comp_name)
            invisible_buttons[key].click(func_for_invisiblebutton,inputs=[],outputs=[ Webui_Comps[comp_name], State_Comps["json2js"], State_Comps["outlog"][0], State_Comps["outlog"][1]])


temp_index = -1
next_index = -1
def func_for_invisiblebutton():
    global temp_index,next_index
    global Webui_Comps_Cur_Val

    temp_index = next_index+1
    next_index = temp_index

    try:
        while( next_index < len(Webui_Comps_Cur_Val) and Webui_Comps_Cur_Val[next_index+1] == None ):
            next_index += 1
    except:
        pass
    
    try:
        print(f"aaaaaaaaa {temp_index} {next_index} {len(Webui_Comps_Cur_Val)}")
        print(f"aaaaaaaaa {Return_Key[temp_index]} {Webui_Comps_Cur_Val[temp_index]} ")
    except:
        pass
    
    if(temp_index > 0):
        add_output_log(f"导入图片：{Return_Key[temp_index]} ") # 第一个组件是用来预计算第一张图的索引 防止出现有没用的页面跳转 所以不用输出日志信息
        
    if(next_index+1 == len(Webui_Comps_Cur_Val)):
        add_output_log(f"导入完成！")
    
    return Webui_Comps_Cur_Val[temp_index], next_index, Output_Log, Output_Log # 因为显示日志的窗口分txt2img和img2img两个位置 所以两个位置同步导出


def fn_import_workflow(workflow_file):
    global workflow_json
    global Webui_Comps_Cur_Val, temp_index, next_index
    
    try:
        config_file = workflow_file[0].name
    except:
        config_file = workflow_file.name

    print("fn_import_workflow "+str(config_file))
    #print("fn_import_workflow "+str(workflow_file[0].name))

    with open(config_file, mode='r', encoding='UTF-8') as f:
        json_str = f.read()
        workflow_json = json.loads(json_str)

    Webui_Comps_Cur_Val = []
    for key in Return_Key:
        image = None
        successed = 2
        tempkey = key
        while successed > 0:
            #print(f"------{successed}-----{key}--")
            try:
                image_data = workflow_json[key]
                matchObj = re.match("data:image/[a-zA-Z0-9]+;base64,",image_data)
                if matchObj != None:
                    image_data = image_data[len(matchObj.group()):]
                image_data = base64.decodebytes(image_data.encode('utf-8'))
                image = Image.open(io.BytesIO(image_data))
                successed = 0
            except:
                # 如果是controlnet 第一张图 就修改一下key值重试一遍
                if(key == "txt2img_controlnet_ControlNet_input_image"):
                    key = "txt2img_controlnet_ControlNet-0_input_image"
                elif(key == "img2img_controlnet_ControlNet_input_image"):
                    key = "img2img_controlnet_ControlNet-0_input_image"

                elif(key == "txt2img_controlnet_ControlNet-0_input_image"):
                    key = "txt2img_controlnet_ControlNet_input_image"
                elif(key == "img2img_controlnet_ControlNet-0_input_image"):
                    key = "img2img_controlnet_ControlNet_input_image"
                else:
                    successed = 0
            successed-=1
        
        # if(key == "img2img_image"):
        #     test_component = image

        Webui_Comps_Cur_Val.append(image)

    temp_index = -1 # 重置索引
    next_index = -1
    # return_vals.append(str(time.time())) # 用来触发json2js事件，python设置完图片 js继续设置其他参数  弃用
    # return tuple(return_vals)
    return str(temp_index), Output_Log, Output_Log

class imgs_callback_params(BaseModel):
    id:str
    img:str

class StateApi():

    BASE_PATH = '/state'

    def get_path(self, path):
        return f"{self.BASE_PATH}{path}"

    def add_api_route(self, path: str, endpoint, **kwargs):
        return self.app.add_api_route(self.get_path(path), endpoint, **kwargs)

    def start(self, _: gr.Blocks, app: FastAPI):
        print("-----------------state_api start------------------")
        self.app = app 
        self.add_api_route('/config.json', self.get_config, methods=['GET']) # 读取本地的config.json
        self.add_api_route('/get_localization', self.get_localization, methods=['GET']) # 读取localization.json
        self.add_api_route('/lightflowconfig', self.get_lightflow_config, methods=['GET']) # python已经加载好的配置workflow_json  发送给 js
        self.add_api_route('/get_imgs_elem_key', self.get_img_elem_key, methods=['GET']) # 获取图片的组件id 由js来设置onchange事件
        self.add_api_route('/imgs_callback', self.imgs_callback, methods=['POST']) # 用户设置了新图片 触发回调保存到 workflow_json
        self.add_api_route('/refresh_ui', self.refresh_ui, methods=['GET']) # 刷新页面之后触发
        self.add_api_route('/output_log', add_output_log, methods=['GET']) 
        # self.add_api_route('/import_workflow', self.fn_import_workflow, methods=['GET']) # 

    def get_config(self):
        return FileResponse(shared.cmd_opts.ui_settings_file)

    def get_localization(self):

        localization_file = ""
        try:
            with open(shared.cmd_opts.ui_settings_file, mode='r', encoding='UTF-8') as f:
                json_str = f.read()
                config_json = json.loads(json_str)
                #print(config_json['localization'])
                localization_file = localization.localizations[config_json['localization']]
        except:
            pass

        print(f"-----------------get_localization {localization_file}------------------")
        if(os.path.exists(localization_file)):
            return FileResponse(localization_file)
        
        return ""

    def get_lightflow_config(self, onlyimg:bool = False):
        global workflow_json
        temp_json = {}
        if(onlyimg):
            for key in Return_Key:
                try:
                    temp_json[key] = workflow_json[key]
                except:
                    pass
        else:
            temp_json = copy.deepcopy(workflow_json)
            for key in Return_Key:
                temp_json[key] = ""

        # print(f"temp_json = {temp_json}")
        return json.dumps(temp_json)


    def get_img_elem_key(self):
        keys_str = ",".join(Return_Key)
        return keys_str

    def imgs_callback(self, img_data:imgs_callback_params):
        global workflow_json
        #print(f"imgs_callback = {id}  {img}")
        workflow_json[img_data.id] = img_data.img

    def refresh_ui(self):
        global workflow_json, Output_Log
        workflow_json = {}
        Output_Log = ""
        print("refresh_ui")



class Script(scripts.Script):  

    def __init__(self) -> None:
        super().__init__()

    def title(self):
        return "lightflow plugin"

    def show(self, is_img2img):
        return scripts.AlwaysVisible

    def ui(self, is_img2img):
        #print("state plugin ui")
        try:
            State_Comps["import"]
            State_Comps["export"]
            State_Comps["outlog"]
        except:
            State_Comps["import"] = []
            State_Comps["export"] = []
            State_Comps["outlog"] = []

        with gr.Accordion('Lightflow '+lightflow_version.lightflow_version, open=False, visible=True):
            with gr.Row():
                lightflow_file = gr.File(label="Lightflow File",file_count="multiple", file_types=[".lightflow"])
                State_Comps["import"].append(lightflow_file)
                State_Comps["outlog"].append(gr.HTML(label="Output Log",value="<p style=color:Tomato;>Welcome to Lightflow!  \(^o^)/~</p><p style=color:MediumSeaGreen;>Welcome to Lightflow!  \(^o^)/~</p><p style=color:DodgerBlue;>Welcome to Lightflow!  \(^o^)/~</p>"))
                #print(State_Comps["import"])

            with gr.Row():
                export_config = gr.Button(value='Export')
                State_Comps["export"].append(export_config)

            json2js = gr.Textbox(label="json2js",visible=False)
            State_Comps["json2js"] = json2js

            if(not is_img2img):
                
                State_Comps["test_button"] = gr.Button(value='测试',visible=False)
                
                with gr.Row():

                    State_Comps["useless_Textbox"] = gr.Textbox(value='useless_Textbox', elem_id='useless_Textbox', visible=False)

                    for key in Return_Key:
                        elem_id = ("img2img_" if is_img2img else "txt2img_") + "invisible_" + key
                        invisible_button = gr.Button(value=elem_id, elem_id=elem_id, visible=False)
                        invisible_buttons[elem_id] = invisible_button
                        #invisible_buttons.append(invisible_button)
                        #invisible_button.click(func_for_invisiblebutton)


# add callbacks
api = StateApi()
script_callbacks.on_app_started(api.start)
script_callbacks.on_after_component(on_after_component)


# init number of controlnet
try:
    webui_settings = {}
    with open(shared.cmd_opts.ui_settings_file, mode='r') as f:
        json_str = f.read()
        webui_settings = json.loads(json_str)
    
    Multi_ControlNet  = webui_settings["control_net_max_models_num"]
    if(Multi_ControlNet == 1):
        Return_Key.append(f"txt2img_controlnet_ControlNet_input_image")
        Return_Key.append(f"img2img_controlnet_ControlNet_input_image")
    else:
        for i in range(Multi_ControlNet):
            Return_Key.append(f"txt2img_controlnet_ControlNet-{i}_input_image")
            Return_Key.append(f"img2img_controlnet_ControlNet-{i}_input_image")
except:
    pass

