from fastapi import FastAPI, Body, HTTPException, Request, Response
from fastapi.responses import FileResponse
from pydantic import BaseModel
import gradio as gr

import os, io, sys
import json
from PIL import Image
import re,base64,copy
import time,requests
import shutil
from urllib.parse import urlparse
import tempfile

from modules import localization, images
import modules.shared as shared
import modules.scripts as scripts
import modules.script_callbacks as script_callbacks
import modules.generation_parameters_copypaste as parameters_copypaste
from modules.generation_parameters_copypaste import paste_fields, registered_param_bindings, parse_generation_parameters
from modules.sd_models import checkpoints_list
from modules import ui_components
from modules.paths_internal import data_path
import launch

from scripts import lightdiffusionflow_version, lightdiffusionflow_config
from scripts.lightdiffusionflow_config import OutputPrompt, Flow_Save_mode, Auto_Fix_Params, LoRAs_In_Use
import scripts.lightdiffusionflow_config as lf_config

# current_path = os.path.abspath(os.path.dirname(__file__))
# sys.path.append(os.path.join(current_path,"lib"))
api = None
workflow_json = {}
State_Comps = {} # 当前页面的按钮组件
invisible_buttons = {}
Webui_Comps = {} # webui上需要操作的图片组件
Webui_Comps_Cur_Val = [] # 顺序与Image_Components_Key一致
Output_Log = ""
g_msg_info = ""

conponents_originlist = []
extensions_conponents = {}
extensions_id_conponents = {}
extensions_id_conponents_value = {}
txt2img_script_container = None
img2img_script_container = None

local_flows_path = "models/LightDiffusionFlow"
flows_path = os.path.join(data_path, local_flows_path) 
flows_path = flows_path.replace("/","\\")
if(not os.path.isdir(flows_path)):
  os.mkdir(flows_path)

local_flow_list = []
Need_Preload = False
Preload_File = r""
File_extension = ".flow"

paste_symbol = '\u2199\ufe0f'  # ↙
refresh_symbol = '\U0001f504'  # 🔄
save_style_symbol = '\U0001f4be'  # 💾
clear_prompt_symbol = '\U0001f5d1\ufe0f'  # 🗑️
apply_style_symbol = '\U0001f4cb'  # 📋


def test_func():
  gr.Warning("hello")
  # global extensions_conponents, extensions_id_conponents
  # global Output_Log
  # print("test_func")
  #print(Output_Log)
  #print(networks.available_networks)
  #print(preprocessor_filters)

  #print(extensions_id_conponents["dropdown"]["state-ext-control-net-txt2img_0-model"].get_config())

  # print(parameters_copypaste.paste_fields)


# fastapi触发不了弹窗
def custom_msg_box():
  global g_msg_info
  if(g_msg_info != ""):
    print(f"gr.Info({g_msg_info})")
    gr.Info(g_msg_info)
    g_msg_info = ""

def clear_markup(html_str):
    clearly_str = html_str
    results = re.findall("(<.+?>)",clearly_str)
    for res in results:
      clearly_str = clearly_str.replace(res,"")
    return clearly_str

def add_output_log(msg:str="", style:str=""):
  global Output_Log
  if(msg != ""):
    clear_msg = clear_markup(msg)
    print(clear_msg)
    Output_Log += f"<p style='color:rgb(192,192,192);{style}'>{msg}</p>"

  #custom_msg_box()
  return Output_Log, Output_Log

def add_output_warning(msg:str=""):
    add_output_log(msg, style="color:Orange;")

def add_output_error(msg:str=""):
    add_output_log(msg, style="color:Red;")

def add_preset_output_log(preset, key, value):
  global g_msg_info
  g_msg_info = ""
  if(preset == "start"):
    add_output_log(OutputPrompt.startimport())
  elif(preset == "finished"):
    g_msg_info = OutputPrompt.import_completed_info()
    add_output_log(OutputPrompt.import_completed())
  elif(preset == "invalid"):
    add_output_log(OutputPrompt.invalid_file())
  elif(preset == "importing_img"):
    add_output_log(OutputPrompt.importing_image(key))
  elif(preset == "alt_option"):
    add_output_log(OutputPrompt.alternative_option(key,value))
  elif(preset == "no_option"):
    add_output_log(OutputPrompt.no_option(key,value))
  elif(preset == "missing_exts"):
    ext_list = value.split(";")
    add_output_log(OutputPrompt.missing_extensions(ext_list))
  elif(preset == "missing_loras"):
    lora_list = value.split(";")
    add_output_log(OutputPrompt.missing_loras(lora_list))
  elif(preset == "download_url"):
    add_output_log(OutputPrompt.click_to_download(key, value))


def read_chunks(file, size=io.DEFAULT_BUFFER_SIZE):
  """Yield pieces of data from a file-like object until EOF."""
  while True:
      chunk = file.read(size)
      if not chunk:
          break
      yield chunk
def gen_file_sha256(filname):
  import hashlib
  """ pip-style sha256 hash generation"""
  print("Use Memory Optimized SHA256")
  blocksize=1 << 20
  sha256_hash = hashlib.sha256()
  length = 0
  with open(os.path.realpath(filname), 'rb') as read_file:
      for block in read_chunks(read_file, size=blocksize):
          length += len(block)
          sha256_hash.update(block)

  hash_value =  sha256_hash.hexdigest()
  print(f"sha256: {hash_value}")
  print(f"length: {length}")
  return hash_value

def find_checkpoint_from_name(name:str):

  for checkpoint in checkpoints_list.keys():
    res = re.search(r"(.+)\.(.+)", checkpoint)
    try:
      if(res.group(1) == name):
        return checkpoint
    except:
      pass
  return name

def find_checkpoint_from_hash(hash:str):

  for checkpoint in checkpoints_list.keys():
    res = re.search(r"\[([0-9a-fA-F]{8,10})\]", checkpoint)
    try:
      if(res.group(1) == hash):
        return checkpoint
    except:
      pass
  return hash

def SearchingCheckPointByHashFromCivitai(hash:str):
  hash_str = hash.replace("[","").replace("]","").strip()
  try:
    response = requests.get("https://civitai.com/api/v1/model-versions/by-hash/"+hash_str)
    if(response.status_code == 200):
      #print(response.content)
      return response.json()
  except:
    pass
  return {}

def refresh_local_flows(*inputs):
  print("refresh_local_flows")
  global local_flow_list,local_flows_path
  flows_path = os.path.join(data_path, local_flows_path) 
  local_flow_list = [f for f in os.listdir(flows_path) if os.path.isfile(
      os.path.join(flows_path, f)) and os.path.splitext(f)[-1] == '.flow']
  # print(inputs)
  # print(local_flow_list)
  ret = []
  for dd in inputs:
    if dd in local_flow_list:
      selected = dd
    else:
      selected = None
    ret.append(gr.Dropdown.update(choices=local_flow_list, value=selected))
  #ret = [gr.Dropdown.update(choices=local_flow_list, value=selected) for i in inputs]
  return ret

def apply_local_flow(selected):
  global local_flow_list,local_flows_path
  global Need_Preload,Preload_File

  if(selected != "" and selected != None):
    flow_path = os.path.join(data_path, local_flows_path, selected) 
    if(os.path.exists(flow_path)):
      print("OK,Local File!")
      print(flow_path)
      Preload_File = flow_path
      Need_Preload = True
      gr.Info(clear_markup(OutputPrompt.startimport()))

def delete_local_flow(selected):
  global local_flow_list,local_flows_path
  if(selected != "" and selected != None):
    flow_path = os.path.join(data_path, local_flows_path, selected) 
    if(os.path.exists(flow_path)):
      os.remove(flow_path)
      print("Local File Deleted!")

def set_lightdiffusionflow_file():
  global Preload_File
  return Preload_File

def on_dropdown_changed(*component):
  global extensions_id_conponents, extensions_id_conponents_value

  extensions_id_conponents_value["dropdown"] = {}
  i = 0
  for id in extensions_id_conponents["dropdown"].keys():
    extensions_id_conponents_value["dropdown"][id] = component[i]
    i+=1

def cn_get_model_type(cn_model_name):

  cn_type_list = ['canny','depth','normalmap','openpose','mlsd','lineart_anime','lineart','softedge','scribble',
    'seg','shuffle','tile','inpaint','ip2p','brightness','illumination','qrcode_monster','qrcode','normalbae']

  type_pattern = "("+"|".join(cn_type_list)+")"
  res = re.search(type_pattern,cn_model_name)
  if(res != None):
    return res.group()

  return None

def set_dropdowns():
  global extensions_id_conponents, workflow_json
  global temp_index,next_index
  global Webui_Comps_Cur_Val, Output_Log

  temp_index = len(Webui_Comps_Cur_Val)
  next_index = temp_index
  
  return_vals = []
  for comp_id in extensions_id_conponents["dropdown"].keys():
    value = None
    new_value = None
    try:
      value = workflow_json.get(comp_id, None)
      if(value == None):
        new_value = extensions_id_conponents["dropdown"][comp_id].get_config()["value"]
      else:
        new_value = value
        matching_successed = False
        options = extensions_id_conponents["dropdown"][comp_id].get_config()["choices"]

        for option in options:
          if(option == new_value):
            matching_successed = True
            break
          else:
            #print(f"去掉多余文件夹路径---{temp_option}----{temp_new_value}----")
            temp_option = os.path.split(option)[-1]
            temp_new_value = os.path.split(new_value)[-1]
            if(temp_option == temp_new_value):
              matching_successed = True
              break

          # 去掉模型的多余路径？
          # if(os.path.split(option)[-1] == os.path.split(new_value)[-1]):
          #   matching_successed = True
          #   break
        
        # 没有完全匹配
        if(not matching_successed):
          
          # controlnet模型
          res = re.search(r"state-ext-control-net-txt2img_[0-9]-model", comp_id)
          if(res != None):
            cn_model = cn_get_model_type(new_value)
            if(cn_model != None):
              if(len(options) <= 1):
                add_preset_output_log("download_url", "ControlNet Models", "https://huggingface.co/lllyasviel/ControlNet-v1-1/tree/main")
              for option in options:
                if(cn_model == cn_get_model_type(option)):
                  new_value = option
                  matching_successed = True
                  break

          # 哈希值匹配
          if(not matching_successed):

            # 寻找哈希值
            value_hash_val = None
            value_no_hash = None
            res = re.search(r"(\[[0-9A-Fa-f]{8,10}\])", new_value)
            if(res != None):
              value_hash_val = res.group(1)
              value_no_hash = new_value.replace(value_hash_val,"").rstrip()
                
            for option in options:

              option_hash_val = None
              option_no_hash = None
              res = re.search(r"(\[[0-9A-Fa-f]{8,10}\])", option)
              if(res != None): # 选项有哈希
                option_hash_val = res.group(1)
                option_no_hash = option.replace(option_hash_val,"").rstrip()
                if(value_hash_val == None): # 值没有哈希
                  if(new_value.rstrip() == option_no_hash):
                    new_value = option
                    matching_successed = True
                    break
                else: # 值有哈希
                  if(value_hash_val == option_hash_val or option_no_hash == value_no_hash):
                    new_value = option
                    matching_successed = True
                    break
              else: # 选项没有哈希
                if(value_hash_val == None): # 值没有哈希
                  if(new_value.rstrip() == option.rstrip()):
                    new_value = option
                    matching_successed = True
                    break
                else: # 值有哈希
                  if(value_no_hash == option.rstrip()):
                    new_value = option
                    matching_successed = True
                    break

          if(matching_successed):
            add_output_log(OutputPrompt.alternative_option(value,new_value))
            #add_output_log(f"Note: '<b style='color:Orange;'>{value}</b>' not found. An approximate match '<b style='color:Orange;'>{new_value}</b>' has been automatically selected as replacement.")
            #print(f"Note: '{value}' not found. An approximate match '{new_value}' has been automatically selected as replacement.")
          else:
            add_output_log(OutputPrompt.no_option(comp_id,value))
            #add_output_log(f"Error: '<b style='color:Red;'>{comp_id}</b>' import failed! The option '<b style='color:Red;'>{value}</b>' was not found!")
            #print(f"'{comp_id}' import failed! The option '{value}' was not found!")
            new_value = extensions_id_conponents["dropdown"][comp_id].get_config()["value"]

    except KeyError as e:
      print(e)
    return_vals.append(new_value)

  return_vals.append(temp_index) # 给json2js
  return_vals.append(Output_Log)
  return_vals.append(Output_Log)
  #print(return_vals)
  return tuple(return_vals)

def set_js_params():
  global temp_index,next_index
  temp_index = next_index+1
  next_index = temp_index
  print("set_js_params")
  return temp_index

# use_elem_id 是为了兼容旧版的图片组件直接使用elem_id作为组件名称的情况
def comp_create_id(component, tab_name, ext_name, sub_tab, use_elem_id = False): 
  comp_id = None
  if(use_elem_id):
    try:
      comp_id = component.elem_id
    except:
      pass
  
  if(comp_id == None):
    #try:
    comp_name = component.get_config()['label'].replace(" ", "-").lower()
    temp_sub_tab = ("_"+sub_tab) if sub_tab != "base" else ""
    comp_id = 'state-ext-'+ ext_name.replace(" ","-").lower() + "-" + tab_name + temp_sub_tab + "-" + comp_name
    #except:
    #  pass

  return comp_id

def params_create_ids():
  global extensions_id_conponents, extensions_conponents
  extensions_id_conponents = {"dropdown":{}, "image":{}}

  for key in lf_config.Image_Components_Key:
    if(key == "useless_Textbox"):
      extensions_id_conponents["image"]["useless_Textbox"] = State_Comps["useless_Textbox"]
    else:
      extensions_id_conponents["image"][key] = Webui_Comps[key]

  for tab_name in extensions_conponents.keys(): # tab name
    for ext_name in extensions_conponents[tab_name].keys(): # plugin name
      comp_index = 0
      for sub_tab in extensions_conponents[tab_name][ext_name].keys(): # sub_tab 如果没有默认就是base
        for comp in extensions_conponents[tab_name][ext_name][sub_tab]: # component
          try:
            # 先只考虑有label的组件
            if(isinstance(comp, gr.Dropdown)):
              # try:
              #   comp_name = comp.get_config()['label'].replace(" ", "-").lower()
              #   temp_sub_tab = ("_"+sub_tab) if sub_tab != "base" else ""
              #   comp_id = 'state-ext-'+ ext_name.replace(" ","-").lower() + "-" + tab_name + temp_sub_tab + "-" + comp_name
              # except:
              #   pass
              comp_id = comp_create_id(comp, tab_name, ext_name, sub_tab)
              # comp_name = comp.get_config()['name'] + "_" + str(comp_index)
              # comp_index += 1
              # comp_id = 'state-ext-'+ ext_name.replace(" ","-").lower() + "-" + comp_name
              extensions_id_conponents["dropdown"][comp_id] = comp
            elif(isinstance(comp, gr.Image)):
              comp_id = comp_create_id(comp, tab_name, ext_name, sub_tab, True)
              if("generated_image" in comp_id):
                pass
                #print(f"skip component: {comp_id}")
              else:
                extensions_id_conponents["image"][comp_id] = comp
              
          except BaseException as e:
            pass
  #print(extensions_id_conponents)

def get_lora_info(using_loras:list):
  import networks
  print(f"using_loras = {using_loras}")
  loras_info = {}
  for lora_name in using_loras:
    for network in networks.available_networks.keys():
      if( (lora_name == networks.available_networks[network].name or lora_name == networks.available_networks[network].alias) and networks.available_networks[network].shorthash != ""):
        print(networks.available_networks[network].filename)
        sha256 = gen_file_sha256(networks.available_networks[network].filename)
        loras_info[sha256] = {
          'name':networks.available_networks[network].name,
          'alias':networks.available_networks[network].alias
        }
  print(f"loras_info = {loras_info}")
  return loras_info

def get_lora_from_prompt(prompt):
  import networks

  available_loras = []
  for network in networks.available_networks.keys():
    available_loras.append((networks.available_networks[network].name,networks.available_networks[network].alias))
  #print(available_loras)
  
  used_loras = []
  re_lora_prompt = re.compile("<lora:([\w_\s.]+):([ \d.]+)>", re.IGNORECASE)
  results = re.findall(re_lora_prompt, prompt)
  # print("使用到的lora:")
  # print(results)
  for res in results:
    lora_name = res[0]
    for lora in available_loras:
      if(lora_name == lora[0] or lora_name == lora[1]):
        used_loras.append(lora_name)
  return used_loras

def get_missing_lora(workflow_json):
  import networks

  data_str = json.dumps(workflow_json)
  # re_parens = re.compile(r"[\\/\[\](){}]+")
  # prompt = re.sub(
  #   re_parens, "", prompt.replace("，", ",")#.replace("-", " ").replace("_", " ")
  # )

  available_loras = []
  for network in networks.available_networks.keys():
    available_loras.append((networks.available_networks[network].name,networks.available_networks[network].alias))
  #print(available_loras)
  
  missing_loras = []
  loras_info = workflow_json[LoRAs_In_Use]
  re_lora_prompt = re.compile("<lora:([\w_\s.]+):([ \d.]+)>", re.IGNORECASE)
  results = re.findall(re_lora_prompt, data_str)
  # print("使用到的lora:")
  # print(results)
  for res in results:
    lora_name = res[0]
    for lora in available_loras:
      if(lora_name == lora[0] or lora_name == lora[1]):
        break
    else:
      # SD默认计算的lora的hash值无法用来在C站搜索，下载链接需要的Hash需单独计算导出才能支持。
      # name,alias,hash,downloadUrl
      for sha256 in loras_info.keys():
        if(loras_info[sha256]["name"] == lora_name or loras_info[sha256]["alias"] == lora_name):
          try:
            model_info = SearchingCheckPointByHashFromCivitai(sha256)
            if(model_info != {}):
              lora_link = OutputPrompt.download_link(lora_name, model_info["downloadUrl"])
              missing_loras.append(lora_link)
              break
          except:
           pass
      else:
        missing_loras.append(lora_name)
  # print("丢失的lora:")
  # print(missing_loras)
  return missing_loras

def get_extname_from_label(label):
  ext_name = label
  res = re.search(r"(.+) v[0-9\.]+", ext_name)
  if(res != None):
    ext_name = res.group(1)
  #兼容旧命名
  if(ext_name == "ControlNet"):
    ext_name = "Control-Net"
  return ext_name


def get_script_container(component):
  global txt2img_script_container, img2img_script_container
  if(txt2img_script_container == None):
    temp = component
    #i = 10
    while temp:
      if(temp.elem_id == "txt2img_script_container"):
        txt2img_script_container = temp
        break
      else:
        temp = temp.parent
        #i-=1
  
  if(img2img_script_container == None):
    temp = component
    i = 10
    while temp and i>0:
      if(temp.elem_id == "img2img_script_container"):
        img2img_script_container = temp
        break
      else:
        temp = temp.parent
        i-=1

def searching_extensions_title():
  global txt2img_script_container, img2img_script_container, extensions_conponents, Flow_Save_mode

  if(Flow_Save_mode == "Core"):
    extensions_conponents["txt2img"] = {}
    extensions_conponents["img2img"] = {}
    extensions_conponents["txt2img"]["Control-Net"] = {"base":[]}
    extensions_conponents["img2img"]["Control-Net"] = {"base":[]}     

  else:
    for group in txt2img_script_container.children: # 遍历读取所有的插件名称

      label = ""
      try:
        label = get_extname_from_label(group.children[0].label)
      except BaseException as e:
        pass
      
      if(label == ""):
        try:
          label = get_extname_from_label(group.children[0].children[0].label)
        except BaseException as e:
          pass

      if(label != ""):
        try:
          extensions_conponents["txt2img"]
        except:
          extensions_conponents["txt2img"] = {}
          extensions_conponents["img2img"] = {}
        extensions_conponents["txt2img"][label] = {"base":[]}
        extensions_conponents["img2img"][label] = {"base":[]}     
        #extensions_conponents[label] = []
    #print(extensions_conponents)

def on_img_changed(*component):
  global extensions_id_conponents, extensions_id_conponents_value

  #test_vals = []
  extensions_id_conponents_value["image"] = {}
  i = 0
  for id in extensions_id_conponents["image"].keys():
    extensions_id_conponents_value["image"][id] = component[i]
    # if(component[i] == None):
    #   test_vals.append("0")
    # else:
    #   test_vals.append("1")
    i+=1

  #print(test_vals)

temp_index = -1
next_index = -1
def func_for_invisiblebutton():
  global temp_index,next_index
  global extensions_id_conponents, Webui_Comps_Cur_Val, Output_Log

  temp_index = next_index+1
  next_index = temp_index

  try:
    while( next_index < len(Webui_Comps_Cur_Val) and Webui_Comps_Cur_Val[next_index+1] == None ):
      next_index += 1
  except:
    pass
  
  # try:
  #   print(f"func_for_invisiblebutton {temp_index} {next_index} {len(Webui_Comps_Cur_Val)}")
  #   print(f"func_for_invisiblebutton {lf_config.Image_Components_Key[temp_index]} {Webui_Comps_Cur_Val[temp_index]} ")
  # except:
  #   pass
  
  
  # 第一个组件是用来预计算第一张图的索引 防止出现有没用的页面跳转 所以不用输出日志信息
  if(temp_index > 0):
    add_output_log(OutputPrompt.importing_image(list(extensions_id_conponents['image'].keys())[temp_index]))
    #add_output_log(f"importing image: \'{list(extensions_id_conponents['image'].keys())[temp_index]}\' ") 
    
  #if(next_index+1 == len(Webui_Comps_Cur_Val)):
    #add_output_log(OutputPrompt.import_completed())
    #add_output_log(f"import completed!")
  
  # 因为显示日志的窗口分txt2img和img2img两个位置 所以两个位置同步导出
  return Webui_Comps_Cur_Val[temp_index], next_index, Output_Log, Output_Log 


def config_filter(config):
  global extensions_id_conponents
  new_config = config
  for comp_type in extensions_id_conponents.keys():
    for comp_id in extensions_id_conponents[comp_type].keys():
      try:
        # 筛掉python相关组件的默认值选项
        default_val = extensions_id_conponents[comp_type][comp_id].get_config()["value"]
        if(default_val == new_config[comp_id]):
          del new_config[comp_id]
      except KeyError as e:
        pass

  if(Auto_Fix_Params == False):
    return new_config
    
  # 处理旧版插件保存的错误参数问题
  print("-------错误参数纠正-------")
  found_tabs = []
  fixed_config = {}
  for param in new_config.keys():
    res = re.match("state-ext-control-net-(txt2img|img2img)_([0-9]+)-(.+)",param)
    if(res != None):
      if(res.group(3) not in ["presets","preprocessor","model"]):
        try:
          found_tabs.index(res.group(2))
        except ValueError:
          found_tabs.append(res.group(2))

  for param in new_config.keys():

    # 缝缝补补。。。 js保存的参数因为是汉语反推回英文，所以就会有 model->模型->models 的情况。
    res = re.search("[-_](model|models|checkpoint|checkpoints)$",param)
    if(res != None):
      for key in ["model","models","checkpoint","checkpoints"]:
        target_word = str(res.group()).replace(res.group(1),key)
        new_param = re.sub("[-_](model|models|checkpoint|checkpoints)$", target_word, param)
        fixed_config[new_param] = new_config[param]
        #print(f"根据{param}，补充{new_param}")
    
    # 纠正编号
    res = re.match("state-ext-control-net-(txt2img|img2img)_([0-9]+)-(.+)",param)
    if(res != None):
      tab_num = int(res.group(2))
      if(res.group(2) != "0" and tab_num%3 == 0 ):
        try:
          found_tabs.index(str(tab_num/3))
          # 如果是9 如果发现3的位置有参数，就还需要检查一下1
          if(tab_num == 9):
            found_tabs.index("1")
        except ValueError:
          new_key = f"state-ext-control-net-{res.group(1)}_{int(tab_num/3)}-{res.group(3)}"
          # 这三个选项，旧版是js控制会有序号问题，新版本py控制没有序号问题，所以这里判断纠正之后的位置有没有值，有的话就不动。
          if(res.group(3) in ["presets","preprocessor","model"]):
              #print(param)
              if(new_config.get(new_key,None) == None):
                fixed_config[new_key] = new_config[param]
                print(f" {param} 改为 {new_key}")
                continue
          else:
            fixed_config[new_key] = new_config[param]
            print(f" {param} 改为 {new_key}")
            continue

    # 其余参数照搬
    fixed_config[param] = new_config[param]

  #print(fixed_config)
  #print("-------处理错误-------")

  new_config = fixed_config
  return new_config


def fn_import_workflow(workflow_file):
  global workflow_json, Output_Log
  global extensions_id_conponents, Webui_Comps_Cur_Val, temp_index, next_index
  temp_index = -1 # 重置索引
  next_index = -1
  
  workflow_json = {}
  workflow_json_str = ""
  if(workflow_file):
    try:
      config_file = workflow_file[0].name
    except:
      config_file = workflow_file.name

    print("fn_import_workflow "+str(config_file))
    if (os.path.splitext(config_file)[-1] in  [File_extension, ".lightflow", ".json"]): # 兼容部分旧版本文件
      with open(config_file, mode='r', encoding='UTF-8') as f:
        workflow_json_str = f.read()
        workflow_json = json.loads(workflow_json_str)

      try:
        response = requests.get("https://api.lightflow.ai/openapi/access?action=import")
        if(response.status_code == 200):
          pass
      except:
        pass

    else:
      print("invalid file!")


  workflow_json = config_filter(workflow_json)

  Webui_Comps_Cur_Val = []
  for key in extensions_id_conponents["image"].keys():
  #for key in lf_config.Image_Components_Key:
    image = None
    successed = 2
    tempkey = key
    while successed > 0:
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
    
    Webui_Comps_Cur_Val.append(image)

  # 检查lora
  missing_loras = []
  try:
    missing_loras = get_missing_lora(workflow_json)
    if(len(missing_loras) > 0):
      add_output_log(OutputPrompt.missing_loras(missing_loras))
    
    # # SD默认计算的lora的hash值无法用来在C站搜索，下载链接需要的Hash需单独计算导出才能支持。
    # # name,alias,hash,downloadUrl
    # loras_info = workflow_json[LoRAs_In_Use]
    # for lora_name in missing_loras:
    #   for sha256 in loras_info.keys():
    #     if(loras_info[sha256]["name"] == lora_name or loras_info[sha256]["alias"] == lora_name):
    #       try:
    #         model_info = SearchingCheckPointByHashFromCivitai(sha256)
    #         if(model_info != {}):
    #           add_preset_output_log("download_url", lora_name, model_info["downloadUrl"])
    #       except:
    #         pass
  except KeyError as e:
    pass
    #print(f"except missing loras error: {e}")

  #print(Webui_Comps_Cur_Val)
  #set_elements()
  # return_vals.append(str(time.time())) # 用来触发json2js事件，python设置完图片 js继续设置其他参数  弃用
  # return tuple(return_vals)
  return str(temp_index)#, Output_Log, Output_Log

class config_params(BaseModel):
  config_data:dict

class imgs_callback_params(BaseModel):
  id:str
  img:str

class png_info_params(BaseModel):
  img_path:str

class file_params(BaseModel):
  file_path:str

class savefile_params(BaseModel):
  file_name:str
  file_data:dict
  overwrite:bool

class StateApi():

  BASE_PATH = '/lightdiffusionflow'

  def get_path(self, path):
    return f"{self.BASE_PATH}{path}"

  def add_api_route(self, path: str, endpoint, **kwargs):
    return self.app.add_api_route(self.get_path(path), endpoint, **kwargs)

  def start(self, _: gr.Blocks, app: FastAPI):
    print("----------------- light_diffusion_flow api start------------------")

    self.app = app 
    # 读取本地的config.json
    self.add_api_route('/local/config.json', self.get_config, methods=['GET']) 
    # python已经加载好的配置workflow_json  发送给 js
    self.add_api_route('/local/lightdiffusionflow_config', self.get_lightdiffusionflow_config, methods=['GET']) 
    self.add_api_route('/local/parse_lora_info', self.parse_lora_info, methods=['POST']) 
    # 获取图片的组件id 由js来设置onchange事件
    self.add_api_route('/local/get_imgs_elem_key', self.get_img_elem_key, methods=['GET']) 
    # 获取当前已安装的插件列表
    self.add_api_route('/local/get_ext_list', self.get_ext_list, methods=['GET']) 
    # 用户设置了新图片 触发回调保存到 workflow_json
    self.add_api_route('/local/imgs_callback', self.imgs_callback, methods=['POST']) 
    self.add_api_route('/local/useless_config_filter', self.useless_config_filter, methods=['POST'])
    # 刷新页面之后触发
    self.add_api_route('/local/refresh_ui', self.refresh_ui, methods=['GET']) 
    self.add_api_route('/local/output_log', add_output_log, methods=['GET']) 
    self.add_api_route('/local/preset_output_log', add_preset_output_log, methods=['GET']) 
    self.add_api_route('/local/png_info', self.png_info, methods=['POST']) # 
    # 传入一个文件路径，返回文件内容
    self.add_api_route('/local/read_file', self.read_file, methods=['POST']) 
    self.add_api_route('/local/file_exist', self.file_exist, methods=['POST']) 
    self.add_api_route('/local/need_preload', self.need_preload, methods=['GET'])
    # 保存当前配置到本地文件夹
    self.add_api_route('/local/save_flow_to_local', self.saveFlowToLocal, methods=['POST'])
    
    self.add_api_route('/set_preload', self.set_preload, methods=['POST'])

  def get_config(self):
    return FileResponse(shared.cmd_opts.ui_settings_file)
  
  def get_ext_list(self):
    global extensions_conponents
    ext_str = ""
    try:
      ext_str = ",".join(list(extensions_conponents["txt2img"].keys())).lower().replace(" ", "-")
    except:
      pass
    return ext_str

  def useless_config_filter(self, config:config_params):
    return config_filter(config.config_data)

  def get_lightdiffusionflow_config(self, data2export:bool = False):
    global workflow_json, extensions_id_conponents, extensions_id_conponents_value
    temp_json = {}
    if(data2export):

      for key in extensions_id_conponents["image"].keys():
      # for key in lf_config.Image_Components_Key:
        try:
          temp_json[key] = workflow_json[key]
        except:
          pass

      # using_loras = get_lora_from_prompt(json.dumps(temp_json))
      # temp_json[LoRAs_In_Use] = get_lora_info(using_loras)
          
      # 导出时调用，这里把py负责的其他组件一起读进来
      for comp_type in extensions_id_conponents_value.keys():
        for comp_id in extensions_id_conponents_value[comp_type].keys():
          try:
            # 默认值的选项不导出
            default_val = extensions_id_conponents[comp_type][comp_id].get_config()["value"]
            if(default_val != extensions_id_conponents_value[comp_type][comp_id]):
              temp_json[comp_id] = extensions_id_conponents_value[comp_type][comp_id]
          except KeyError as e:
            pass
    else:
      temp_json = copy.deepcopy(workflow_json)
      for key in extensions_id_conponents["image"].keys():
      #for key in lf_config.Image_Components_Key:
        temp_json[key] = ""

    return json.dumps(temp_json)

  def parse_lora_info(self, config:config_params):
    temp_json = {}
    json_str = json.dumps(config.config_data)
    using_loras = get_lora_from_prompt(json_str)
    temp_json[LoRAs_In_Use] = get_lora_info(using_loras)
    return temp_json

  def str_2_json(self, str_data:str):
    out_json = {}
    res = re.findall(r"([^:]+:[^:]{1,})(,|$)",str_data)
    for field in res:
      data = field[0].split(":")
      try:
        out_json[data[0].strip()] = data[1].strip()
      except IndexError as e:
        print(f"str_2_json [key error]: {e}")
    return out_json

  def png_info(self, img_data:png_info_params):

    geninfo, items = images.read_info_from_image(Image.open(img_data.img_path))
    geninfo = parse_generation_parameters(geninfo)
    temp_json = {}
    for key in geninfo.keys():
      
      matchObj = re.match("ControlNet ([0-9])", key)
      if(matchObj != None): # controlnet
        cn_info = self.str_2_json(geninfo[key])
        if(len(cn_info.keys()) > 0):
          temp_json["state-ext-control-net-txt2img_0-enable".replace("0",matchObj.group(1))] = True

        for cn_key in cn_info.keys():
          if(cn_key == "starting/ending"):
            cn_key_split = cn_key.split("/")
            data = cn_info[cn_key].replace("(","").replace(")","").split(",")
            temp_json[lf_config.PNGINFO_CN_2_LIGHTDIFFUSIONFLOW[cn_key_split[0]].replace("0",matchObj.group(1))]\
               = data[0].strip()
            temp_json[lf_config.PNGINFO_CN_2_LIGHTDIFFUSIONFLOW[cn_key_split[1]].replace("0",matchObj.group(1))]\
               = data[1].strip()
          elif(cn_key == "pixel perfect"):
            temp_json[lf_config.PNGINFO_CN_2_LIGHTDIFFUSIONFLOW[cn_key].replace("0",matchObj.group(1))]\
               = (cn_info[cn_key].lower() == "true")
          else:
            try:
              temp_json[lf_config.PNGINFO_CN_2_LIGHTDIFFUSIONFLOW[cn_key.lower()].replace("0",matchObj.group(1))] = cn_info[cn_key]
            except KeyError as e:
              print(f"ControlNet option '{cn_key}' parsing failed.")

      elif(key == "Model hash"):
        target_model = find_checkpoint_from_hash(geninfo[key])
        if(target_model == geninfo[key]):#说明没有找到相同hash值的模型，改用名称查找
          try:
            target_model = find_checkpoint_from_name(geninfo["Model"])
          except:
            pass
        temp_json[lf_config.PNGINFO_2_LIGHTDIFFUSIONFLOW[key]] = target_model

      elif(key == "Face restoration"):
        temp_json[lf_config.PNGINFO_2_LIGHTDIFFUSIONFLOW[key]] = True
      else:
        try:
          temp_json[lf_config.PNGINFO_2_LIGHTDIFFUSIONFLOW[key]] = geninfo[key]
        except KeyError as e:
          pass
          #print(e)
      
      if(key in ["Hires upscale","Hires steps","Hires upscaler","Hires resize-1","Hires resize-2"]):
        temp_json["state-txt2img_enable_hr"] = True

    return json.dumps(temp_json)

  def read_file(self, params:file_params):
    print("read_file")
    file_content = ""
    with open(params.file_path, mode='r', encoding='UTF-8') as f:
      file_content = f.read()
    return file_content

  def file_exist(self, params:file_params):
    print("file_exist")
    if(not os.path.exists(params.file_path)):
      flow_path = os.path.join(data_path, local_flows_path, params.file_path) 
      if(os.path.exists(flow_path)):
        return True
      else:
        return False
    return False

  def get_img_elem_key(self):
    global extensions_id_conponents
    keys_str = ""
    #keys_str = ",".join(lf_config.Image_Components_Key)
    try:
      keys_str = ",".join(list(extensions_id_conponents["image"].keys()))
    except:
      pass
    return keys_str

  def imgs_callback(self, img_data:imgs_callback_params):
    global workflow_json
    workflow_json[img_data.id] = img_data.img

  def refresh_ui(self):
    global workflow_json, Output_Log
    workflow_json = {}
    Output_Log = ""
    print("refresh_ui")  
    tag = launch.git_tag()
    return tag

  def set_preload(self, params:file_params):
    global Need_Preload,Preload_File
    print(params.file_path)
    res = "OK"
    if(params.file_path):
      if(os.path.exists(params.file_path)):
        Preload_File = params.file_path
        Need_Preload = True
        res = "OK,Local File!"
      else:
        response = requests.get(params.file_path)
        if(response.status_code == 200):
          parsed_url = urlparse(params.file_path)
          file_name = os.path.basename(parsed_url.path)
          tempdir = os.path.join(tempfile.gettempdir(),"lightdiffusionflow_temp")
          if(os.path.exists(tempdir)):
            shutil.rmtree(tempdir)
          if(not os.path.exists(tempdir)):
            os.mkdir(tempdir)
          temp_file = os.path.join(tempdir,file_name)
          
          with open(temp_file,"wb") as f:
            f.write(response.content)
          
          print(temp_file)
          Preload_File = temp_file
          Need_Preload = True
          res = "OK,Network File!"
        else:
          res = "Invalid File!"

    return res

  def need_preload(self):
    global Need_Preload,Preload_File
    if(Need_Preload):
      Need_Preload = False
      return Preload_File
    return ""

  def saveFlowToLocal(self, data_to_save:savefile_params):
    global local_flows_path
    global add_output_log

    overall_data = {}
    print(data_to_save.file_name)
    print(data_to_save.file_data)
    filedata = data_to_save.file_data

    # python处理的图片和dropdown信息
    overall_data = json.loads(self.get_lightdiffusionflow_config(True))
    for key in filedata.keys():
      if(filedata[key] != ""):
        overall_data[key] = filedata[key]

    # Lora信息
    params = config_params(config_data=overall_data)
    lora_info = self.parse_lora_info(params)
    for key in lora_info.keys():
      overall_data[key] = lora_info[key]

    # 过滤掉一些没用的默认值的信息
    overall_data = config_filter(overall_data)

    flow_path = os.path.join(data_path, local_flows_path, data_to_save.file_name) 
    print(flow_path)
    if(not os.path.exists(flow_path) or (data_to_save.overwrite)):
      with open(flow_path,"w") as f:
        #json.dump(overall_data,f)
        f.write(json.dumps(overall_data, ensure_ascii=False, indent=4))
      add_output_log(OutputPrompt.save_completed())
    else:
      add_output_log(OutputPrompt.save_failed())

    return flow_path

class Script(scripts.Script):  

  def __init__(self) -> None:
    super().__init__()
    #记录无id元素的id
    self.new_ids={}

  def title(self):
    return "lightdiffusionflow plugin"

  def show(self, is_img2img):
    return scripts.AlwaysVisible

  def after_component(self, component, **kwargs):
    '''
    python触发导入事件，按正常触发逻辑先执行js代码，把除图片以外的参数全部设置好，
    然后回到python代码，读取图片保存到Webui_Comps_Cur_Val，
    再用json2js的onchange事件触发js来点击隐藏按钮开始触发设置图片的事件队列。
    代码从on_after_component 移到script里的after_component:
      txt2img和img2img面板以外的组件回调不再有效
      但是可以读取self.is_img2img确定当前组件存在的面板
    '''
    # #当前模式
    # teb_mode="img2img" if self.is_img2img else "txt2img"
    # #空id补全方法
    # def in_zone(dom,id=""):
    #   if dom:
    #     if dom.elem_id:
    #       id+="-"+dom.elem_id
    #       return in_zone(dom.parent,id)
    #     elif dom.elem_classes and dom.elem_classes[0]!='gradio-blocks':
    #       if dom.elem_classes[0]=='gradio-accordion':
    #         id+='-'+dom.label+"?"
    #       return in_zone(dom.parent,id)
    #   if re.search('2img_(textual|hypernetworks|checkpoints|lora)_',id):
    #     return False
    #   else:
    #     id=re.sub(r'\?[^\?]+$|[ \?]','',id)
    #     if id in self.new_ids:
    #       self.new_ids[id]+=1
    #     else:
    #       self.new_ids[id]=1
    #     return id+'-'+str(self.new_ids[id])
  
    # #记录组件
    # try:
    #   #拉取id
    #   id=component.elem_id
    #   #若没有就重构
    #   if id==None:
    #     id=component.elem_id==in_zone(component.parent,teb_mode)
    #   Webui_Comps[id] = component
    # except BaseException as e:
    #   pass

    global txt2img_script_container, img2img_script_container, extensions_id_conponents, extensions_conponents
    
    conponents_originlist.append((component, 'img2img' if self.is_img2img else 'txt2img'))
    #print(f"after_component {component} {kwargs.get('elem_id', None)} {'img2img' if self.is_img2img else 'txt2img'} ")
    try:

      if kwargs["elem_id"] == "txt2img_generation_info_button": # or kwargs["elem_id"] == "img2img_generation_info_button":
        self.custom_ui()

      if(Webui_Comps.get(kwargs["elem_id"], None) == None):
        Webui_Comps[kwargs["elem_id"]] = component
        #print(kwargs["elem_id"])

    except BaseException as e:
      pass

    get_script_container(component)

    if (isinstance(component, gr.Button) and kwargs["elem_id"] == "img2img_generation_info_button"): # 加载到最后一个组件了。   兼容旧版，暂时不使用“img2img_preview_filename”

      searching_extensions_title()
      #print(extensions_conponents)

      for comp_tuple in conponents_originlist:
        comp = comp_tuple[0]
        temp_parent  = comp.parent
        mode_tab = comp_tuple[1]
        tab = None
        tabs = None
        ext_name = ""

        # --------------------------------------组件分类--------------------------------------------------
        while temp_parent:
          try:
            # tab 如果有多层只存最上层
            if(isinstance(temp_parent,gr.Tab)):
              tab = temp_parent
            if(isinstance(temp_parent,gr.Tabs)):
              tabs = temp_parent

            temp_ext_name = get_extname_from_label(temp_parent.label)
            if(extensions_conponents[mode_tab].get(temp_ext_name, None) != None):
              ext_name = temp_ext_name
              break
          except BaseException as e:
            pass
          temp_parent = temp_parent.parent

        try:
          if(tabs):
            tab_index = 0
            for temp_tab in tabs.children:
              if (tab == temp_tab):
                break
              tab_index+=1
            if(extensions_conponents[mode_tab][ext_name].get(str(tab_index), None) != None):
              extensions_conponents[mode_tab][ext_name][str(tab_index)].append(comp)
            else:
              extensions_conponents[mode_tab][ext_name][str(tab_index)] = [comp]
          else:
            extensions_conponents[mode_tab][ext_name]["base"].append(comp)
        except KeyError as e:
          pass

      # print(extensions_conponents) # 整理好的第三方插件用到的组件
      # --------------------------------------组件分类--------------------------------------------------
      
      if(self.is_img2img):
          State_Comps["useless_Textbox"] = \
            gr.Textbox(value='useless_Textbox', elem_id='useless_Textbox', visible=False)

      params_create_ids()
      
      # img2img下的面板
      self.custom_ui()

      target_comps = []
      target_comps.append(State_Comps["json2js"]) # 触发事件传递json给js
      #target_comps.append(State_Comps["outlog"][0])
      #target_comps.append(State_Comps["outlog"][1]) # 因为显示日志的窗口分txt2img和img2img两个位置 所以两个位置同步导出
      
      for i in range(len(State_Comps["local_flows"])):
        #State_Comps["local_flows"]
        State_Comps["refresh"][i].click(refresh_local_flows, inputs=State_Comps["local_flows"],outputs=State_Comps["local_flows"])
        State_Comps["apply"][i].click(apply_local_flow, inputs=[State_Comps["local_flows"][i]],outputs=[])
        State_Comps["save"][i].click(fn=None,_js="state.core.actions.saveFlowToLocal", inputs=[],outputs=[])
        #State_Comps["delete"][i].click(delete_local_flow, inputs=[State_Comps["local_flows"][i]],outputs=State_Comps["local_flows"])
        

      for btn in State_Comps["export"]:
        btn.click(None,_js="state.core.actions.exportState") #, inputs=[],outputs=[] 

      for btn in State_Comps["import"]:
        # js里加载除图片以外的参数 python加载图片
        btn.upload(fn_import_workflow, _js=f"state.core.actions.handleLightDiffusionFlow",
          inputs=[btn],outputs=target_comps, show_progress=False)

      State_Comps["json2js"].change(fn=None,_js="state.core.actions.startImportImage",
        inputs=[State_Comps["json2js"]])
      
      State_Comps["test_button"].click(test_func,_js="state.utils.testFunction",inputs=[])

      State_Comps["refresh_log"].click(add_output_log,inputs=[],outputs=[State_Comps["outlog"][0], State_Comps["outlog"][1]])

      on_dropdown_change_inputs = list(extensions_id_conponents["dropdown"].values())
      for comp_to_bind in extensions_id_conponents["dropdown"].keys():
        extensions_id_conponents["dropdown"][comp_to_bind].change(on_dropdown_changed,inputs=on_dropdown_change_inputs,outputs=[])

      # change事件，每次上传一张图会触发change时间几十次
      # clear事件，删除图片的时候不触发，官方bug好像新版本有解决。
      # edit事件，每次编辑都能触发一次，上传图片的时候也能触发。
      # 没有合适的清除图片的事件，无法使用python监控图片组件
      # on_img_change_inputs = list(extensions_id_conponents["image"].values())
      # for comp_to_bind in extensions_id_conponents["image"].keys():
      #   extensions_id_conponents["image"][comp_to_bind].edit(on_img_changed,inputs=on_img_change_inputs,outputs=[])
      #   extensions_id_conponents["image"][comp_to_bind].clear(on_img_changed,inputs=on_img_change_inputs,outputs=[])

      temp_dropdown_outputs = list(extensions_id_conponents["dropdown"].values())
      temp_dropdown_outputs.append(State_Comps["json2js"]) # json2js触发完成事件
      temp_dropdown_outputs.append(State_Comps["outlog"][0]) # 输出日志
      temp_dropdown_outputs.append(State_Comps["outlog"][1]) # 输出日志
      State_Comps["set_dropdowns"].click(set_dropdowns,inputs=[],outputs=temp_dropdown_outputs,show_progress=False)

      State_Comps["set_js_params"].click(set_js_params,inputs=[],outputs=State_Comps["json2js"])

      input_component = State_Comps["background_import"] #State_Comps["import"][0]
      State_Comps["set_file_button"].click(set_lightdiffusionflow_file,inputs=[],outputs=[input_component])
      State_Comps["preload_button"].click(fn_import_workflow, _js=f"state.core.actions.handleLightDiffusionFlow", 
        inputs=[input_component],outputs=target_comps)

      for key in invisible_buttons.keys():
        segs = key.split("_")
        comp_name = "_".join(segs[2:])
        #print(comp_name)
        try:
          invisible_buttons[key].click(func_for_invisiblebutton,
            inputs=[], 
            outputs=[
              #Webui_Comps[comp_name], 
              extensions_id_conponents["image"][comp_name],
              State_Comps["json2js"], 
              State_Comps["outlog"][0], 
              State_Comps["outlog"][1]
            ])
        except KeyError:
          print(f"No such component: {comp_name}")
      
      print("LightDiffusionFlow 绑定完成")

  def ui(self, is_img2img):
    pass

  def custom_ui(self):
    global File_extension, extensions_id_conponents
    try:
      State_Comps["import"]
      State_Comps["export"]
      State_Comps["outlog"]
      State_Comps["local_flows"]
      State_Comps["apply"]
      State_Comps["delete"]
      State_Comps["save"]
      State_Comps["refresh"]
    except:
      State_Comps["import"] = []
      State_Comps["export"] = []
      State_Comps["outlog"] = []
      State_Comps["local_flows"] = []
      State_Comps["apply"] = []
      State_Comps["delete"] = []
      State_Comps["save"] = []
      State_Comps["refresh"] = []


    cur_mode = "img2img" if self.is_img2img else "txt2img"
    save_mode = " (for all extensions)"
    if(Flow_Save_mode == "Core"):
      save_mode = " (only ControlNet)"

    global local_flow_list,local_flows_path
    flows_path = os.path.join(data_path, local_flows_path) 
    local_flow_list = [f for f in os.listdir(flows_path) if os.path.isfile(
        os.path.join(flows_path, f)) and os.path.splitext(f)[-1] == '.flow']

    with gr.Accordion('LightDiffusionFlow '+lightdiffusionflow_version.lightdiffusionflow_version + save_mode, open=True, visible=True, elem_id=cur_mode+'_lightdiffusionflow'):

      with gr.Row():
        State_Comps["local_flows"].append(gr.Dropdown(label="", show_label=False , multiselect=False, choices=local_flow_list,value='',elem_id=cur_mode+'_ldf_local_flows'))
        State_Comps["apply"].append(ui_components.ToolButton(value=paste_symbol,elem_id=cur_mode+'_ldf_apply'))
        #State_Comps["delete"].append(ui_components.ToolButton(value=clear_prompt_symbol,elem_id=cur_mode+'_ldf_delete'))
        State_Comps["save"].append(ui_components.ToolButton(value=save_style_symbol,elem_id=cur_mode+'_ldf_save'))
        State_Comps["refresh"].append(ui_components.ToolButton(value=refresh_symbol,elem_id=cur_mode+'_ldf_refresh'))

      with gr.Row():
        gr.HTML(label="",value="<hr style='margin-top:10px;margin-bottom:10px'></hr>")

      with gr.Row():
        lightdiffusionflow_file = gr.File(label="LightDiffusionFlow File",file_count="single", file_types=[File_extension], elem_id=cur_mode+'_ldf_import')
        State_Comps["import"].append(lightdiffusionflow_file)
        
        with gr.Column(scale=1):
          gr.HTML(label="",value='''
          <a style ="text-decoration:underline;color:cornflowerblue;",
          href="https://www.lightflow.ai/">开源社区/open-source community</a>''')
          State_Comps["outlog"].append(gr.HTML(label="Output Log",elem_id=cur_mode+'_ldf_outlog',value='''
          <p style=color:Red;>Welcome to LightDiffusionFlow!  \(^o^)/~</p>
          <p style=color:MediumSeaGreen;>Welcome to LightDiffusionFlow!  \(^o^)/~</p>
          <p style=color:DodgerBlue;>Welcome to LightDiffusionFlow!  \(^o^)/~</p>'''))

      with gr.Row():
        export_config = gr.Button(value='导出/Export',elem_id=cur_mode+'_ldf_export')
        State_Comps["export"].append(export_config)

      if(self.is_img2img):
        State_Comps["background_import"] = gr.File(label="LightDiffusionFlow File",file_count="single",
           file_types=[File_extension],visible=False)
        State_Comps["json2js"] = gr.Textbox(label="json2js",visible=False)
        State_Comps["test_button"] = gr.Button(value='测试',elem_id='test_button',visible=True)
        State_Comps["refresh_log"] = gr.Button(value='刷新日志',elem_id='img2img_invisible_refresh_log',visible=False)
        State_Comps["set_dropdowns"] = gr.Button(value='设置部分参数',elem_id='lightdiffusionflow_set_dropdowns',visible=False)
        State_Comps["set_js_params"] = gr.Button(value='设置剩下的js参数',elem_id='lightdiffusionflow_set_js_params',visible=False)
        State_Comps["set_file_button"] = gr.Button(value='设置文件',elem_id='set_lightdiffusionflow_file',visible=False)
        State_Comps["preload_button"] = gr.Button(value='预加载',elem_id='preload_button',visible=False)

        with gr.Row():
          #State_Comps["useless_Textbox"] = \
          #  gr.Textbox(value='useless_Textbox', elem_id='useless_Textbox', visible=False)
          
          #for key in lf_config.Image_Components_Key:
          for key in extensions_id_conponents["image"].keys():
            #print(key)
            elem_id = ("img2img_" if self.is_img2img else "txt2img_") + "invisible_" + key
            invisible_buttons[elem_id] = gr.Button(value=elem_id, elem_id=elem_id, visible=False)



def on_after_component(component, **kwargs):
  global Webui_Comps

  # img2img和txt2img面板以外的组件信息只能在这里获取
  # 如果希望python里控制这些组件，还需要把部分代码移到这里实现
  try:
    if(Webui_Comps.get(kwargs["elem_id"], None) == None):
      Webui_Comps[kwargs["elem_id"]] = component
      #if( kwargs["elem_id"] == "setting_sd_model_checkpoint"):
      #  print("--------------setting_sd_model_checkpoint---------------")
  except KeyError:
    pass


def on_before_reload():
  lightdiffusionflow_config.init()

# add callbacks
api = StateApi()
script_callbacks.on_app_started(api.start)
script_callbacks.on_after_component(on_after_component)
script_callbacks.on_before_reload(on_before_reload)
