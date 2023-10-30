import json

PNGINFO_2_LIGHTDIFFUSIONFLOW = {}
PNGINFO_CN_2_LIGHTDIFFUSIONFLOW = {}
Image_Components_Key = {}

class OutputPrompt_English:

  def startimport():
    return "<hr style='margin-top:10px;margin-bottom:10px'></hr><b style='color:LimeGreen;'>Start parsing settings...</b>"

  def invalid_file():
    return "<b style='color:Red;'>Please select a valid lightdiffusionflow or image file!</b>"

  def importing_image(image_name):
    return f"<b style='color:LimeGreen;'>importing image: '{image_name}'.</b>"

  def import_completed():
    return "<b style='color:LimeGreen;'>import completed!</b>"

  def alternative_option(target_value, new_value):
    return f'''Note: '<b style='color:Orange;'>{target_value}</b>' not found,<br>\
      An approximate match '<b style='color:Orange;'>{new_value}</b>' has been automatically selected as replacement.'''

  def no_option(option_name, value):
    return f'''Error: '<b style='color:Red;'>{option_name}</b>' import failed!<br>\
    The option '<b style='color:Red;'>{value}</b>' was not found!'''

  def missing_extensions(ext_list:[]):
    error_str = "Note: <b style='color:Orange;'>Found missing extensions.</b></p>"
    for ext in ext_list:
      error_str+="<p>- <b style='color:Orange;'>"+ext+"</b></p> "
    error_str+="<b style='color:Orange;'>The above Extension Missing Reminder is for reference only. Please determine the necessary plugins based on your actual needs and specific conditions.</b></p> "
    return error_str

  def click_to_download(file_name, file_url):
    return f'''<p style="color:Orange;">Click to download \
    <a style ='text-decoration:underline;color:cornflowerblue;', target="_blank", href='{file_url}'> {file_name} </a>
    '''

class OutputPrompt_Chinese:

  def startimport():
    return "<hr style='margin-top:10px;margin-bottom:10px'></hr><b style='color:LimeGreen;'>开始解析设置...</b>"

  def invalid_file():
    return "<b style='color:Red;'>请选择一个有效的flow文件，或者含png_info数据的图片!</b>"

  def importing_image(image_name):
    return f"<b style='color:LimeGreen;'>导入图片'{image_name}'...</b>"

  def import_completed():
    return "<b style='color:LimeGreen;'>导入完成!</b>"

  def alternative_option(target_value, new_value):
    return f'''注意: 未找到选项'<b style='color:Orange;'>{target_value}</b>',<br>\
      已使用近似选项'<b style='color:Orange;'>{new_value}</b>'代替.'''

  def no_option(option_name, value):
    if(option_name == "stable diffusion checkpoint"):
      return f'''未找到大模型'<b style='color:Orange;'>{value}</b>'!'''
    clear_option_name = option_name.replace("state-ext-","")
    return f'''错误: '<b style='color:Red;'>{clear_option_name}</b>'导入失败!<br>\
    未找到选项'<b style='color:Red;'>{value}</b>'!'''

  def missing_extensions(ext_list:[]):
    error_str = "注意, <b style='color:Orange;'>发现缺失的插件:</b></p>"
    for ext in ext_list:
      error_str+="<p>- <b style='color:Orange;'>"+ext+"</b></p> "
    error_str+="<b style='color:Orange;'>以上插件缺失提示仅供参考，请注意辨别实际情况下您所需要安装的插件。</b></p> "
    return error_str

  def click_to_download(file_name, file_url):
    name = file_name
    if(name == "ControlNet Models"):
      name = "常用ControlNet模型"
      return f'''<p style="color:Orange;">点击下载 \
      <a style ='text-decoration:underline;color:cornflowerblue;', target="_blank", href='https://pan.quark.cn/s/eafa2a9df949'> 常用ControlNet模型 </a>
      '''

    return f'''<p style="color:Orange;">点击下载 \
    <a style ='text-decoration:underline;color:cornflowerblue;', target="_blank", href='{file_url}'> {name} </a>
    '''

OutputPrompt = OutputPrompt_English

# 改成函数调用，修改配置之后能及时刷新
def init():
  global PNGINFO_2_LIGHTDIFFUSIONFLOW,PNGINFO_CN_2_LIGHTDIFFUSIONFLOW
  global OutputPrompt,Image_Components_Key
  # PNG Info的功能除了主要的选项以外其他的都靠第三方插件的主动支持，后续再考虑能否有优化的办法
  #print(parameters_copypaste.paste_fields) 
  PNGINFO_2_LIGHTDIFFUSIONFLOW = {
    "Prompt": "state-txt2img_prompt",
    "Negative prompt": "state-txt2img_neg_prompt",
    "Steps": "state-txt2img_steps",
    "Sampler": "state-txt2img_sampling",
    "CFG scale": "state-txt2img_cfg_scale",
    "Seed": "state-txt2img_seed",
    "Face restoration": "state-txt2img_restore_faces",
    "Size-1": "state-txt2img_width",
    "Size-2": "state-txt2img_height",
    "Model hash": "state-setting_sd_model_checkpoint",
    "Denoising strength": "state-txt2img_denoising_strength",
    "Hires upscale": "state-txt2img_hr_scale",
    "Hires steps": "state-txt2img_hires_steps",
    "Hires upscaler": "state-txt2img_hr_upscaler",
    "Hires resize-1": "state-txt2img_hr_resize_x",
    "Hires resize-2": "state-txt2img_hr_resize_y",
    "Clip skip": "setting_CLIP_stop_at_last_layers",
    "ENSD": "setting_eta_noise_seed_delta"
  }

  PNGINFO_CN_2_LIGHTDIFFUSIONFLOW = {
    "Module": "state-ext-control-net-txt2img_0-preprocessor",
    "preprocessor": "state-ext-control-net-txt2img_0-preprocessor",
    "model": "state-ext-control-net-txt2img_0-model",
    "weight": "state-ext-control-net-txt2img_0-control-weight",
    "starting": "state-ext-control-net-txt2img_0-starting-control-step",
    "ending": "state-ext-control-net-txt2img_0-guidance-end-(t)",
    "guidance start": "state-ext-control-net-txt2img_0-starting-control-step",
    "guidance end": "state-ext-control-net-txt2img_0-ending-control-step",
    "resize mode": "state-ext-control-net-txt2img_0-resize-mode",
    "pixel perfect": "state-ext-control-net-txt2img_0-pixel-perfect",
    "control mode": "state-ext-control-net-txt2img_0-control-mode",
    "preprocessor params": ""
  }

  try:
    import modules.shared as shared
    webui_settings = {}
    with open(shared.cmd_opts.ui_settings_file, mode='r') as f:
      json_str = f.read()
      webui_settings = json.loads(json_str)

      successed = False
      auto_language = False
      try:
        # 优先读取自己的设置
        if(webui_settings['lightdiffusionflow-language'] == "default"):
          auto_language = True
        elif(webui_settings['lightdiffusionflow-language'] == "english"):
          OutputPrompt = OutputPrompt_English
          successed = True
        else:
          OutputPrompt = OutputPrompt_Chinese
          successed = True
      except:
        OutputPrompt = OutputPrompt_English
      
      # 如果是default就读取其他设置配合
      if(auto_language and not successed):
        # 自带的本地化文件
        localization_files = ["zh_CN", "zh-Hans (Stable) [vladmandic]", "zh-Hans (Stable)",
          "zh-Hans (Testing) [vladmandic]", "zh-Hans (Testing)","chinese-all-1024","chinese-english-1024"]
        try:
          # 如果用户使用了中文汉化文件，插件也默认显示中文
          localization_files.index(webui_settings["localization"])
          OutputPrompt = OutputPrompt_Chinese
          successed = True
        except:
          pass
        
        # 第三方翻译插件bilingual-localization
        if(not successed):
          try:
            if(webui_settings["bilingual_localization_enabled"] and webui_settings["bilingual_localization_file"] != "None"):
              OutputPrompt = OutputPrompt_Chinese
              successed = True
          except:
            OutputPrompt = OutputPrompt_English
  except:
    pass

  Image_Components_Key = [
    # 第一个组件是用来预计算第一张有效图的索引 防止出现有没用的页面跳转
    "useless_Textbox", 
    # 每个图片组件的elem_id
    "img2img_image","img2img_sketch","img2maskimg","inpaint_sketch","img_inpaint_base","img_inpaint_mask", 
    ] # 只保存图片组件id，其他参数js里搞定


  # # init number of controlnet
  # try:
  #   webui_settings = {}
  #   with open(shared.cmd_opts.ui_settings_file, mode='r') as f:
  #     json_str = f.read()
  #     webui_settings = json.loads(json_str)
    
  #   Multi_ControlNet = webui_settings.get("control_net_unit_count", None) # controlnet数量，新版名字
  #   if(Multi_ControlNet == None):
  #     Multi_ControlNet = webui_settings.get("control_net_max_models_num", 0)
  #   print(f"Multi_ControlNet = {Multi_ControlNet}")
  #   if(Multi_ControlNet == 1):
  #     Image_Components_Key.append(f"txt2img_controlnet_ControlNet_input_image")
  #     Image_Components_Key.append(f"img2img_controlnet_ControlNet_input_image")
  #   else:
  #     for i in range(Multi_ControlNet):
  #       Image_Components_Key.append(f"txt2img_controlnet_ControlNet-{i}_input_image")
  #       Image_Components_Key.append(f"img2img_controlnet_ControlNet-{i}_input_image")
        
  # except:
  #   pass

  # # Segment Anything images
  # Image_Components_Key.extend(["txt2img_sam_input_image","img2img_sam_input_image"])



init()