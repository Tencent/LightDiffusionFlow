import json
import modules.shared as shared

PNGINFO_2_LIGHTDIFFUSIONFLOW = {}
PNGINFO_CN_2_LIGHTDIFFUSIONFLOW = {}
Image_Components_Key = {}

# 改成函数调用，修改配置之后能及时刷新
def init():
  global PNGINFO_2_LIGHTDIFFUSIONFLOW,PNGINFO_CN_2_LIGHTDIFFUSIONFLOW,Image_Components_Key
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

  Image_Components_Key = [
    # 第一个组件是用来预计算第一张有效图的索引 防止出现有没用的页面跳转
    "useless_Textbox", 
    # 每个图片组件的elem_id
    "img2img_image","img2img_sketch","img2maskimg","inpaint_sketch","img_inpaint_base","img_inpaint_mask", 
    ] # 只保存图片组件id，其他参数js里搞定


  # init number of controlnet
  try:
    webui_settings = {}
    with open(shared.cmd_opts.ui_settings_file, mode='r') as f:
      json_str = f.read()
      webui_settings = json.loads(json_str)
    
    Multi_ControlNet = webui_settings.get("control_net_unit_count", None) # controlnet数量，新版名字
    if(Multi_ControlNet == None):
      Multi_ControlNet = webui_settings.get("control_net_max_models_num", 0)
    print(f"Multi_ControlNet = {Multi_ControlNet}")
    if(Multi_ControlNet == 1):
      Image_Components_Key.append(f"txt2img_controlnet_ControlNet_input_image")
      Image_Components_Key.append(f"img2img_controlnet_ControlNet_input_image")
    else:
      for i in range(Multi_ControlNet):
        Image_Components_Key.append(f"txt2img_controlnet_ControlNet-{i}_input_image")
        Image_Components_Key.append(f"img2img_controlnet_ControlNet-{i}_input_image")
        
  except:
    pass

  # Segment Anything images
  Image_Components_Key.extend(["txt2img_sam_input_image","img2img_sam_input_image"])

init()