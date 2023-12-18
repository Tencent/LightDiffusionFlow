import gradio as gr
import modules.shared as shared
from modules import scripts
from scripts import lightdiffusionflow_config
#from scripts.lightdiffusionflow_config import OutputPrompt
OutputPrompt = lightdiffusionflow_config.OutputPrompt

def on_ui_settings():

  section = ("lightdiffusionflow", "Light Diffusion Flow")

    # "sd_lora": shared.OptionInfo("None", "Add network to prompt", gr.Dropdown,
    # lambda: {"choices": ["None", *networks.available_networks]}, refresh=networks.list_available_networks),
  shared.opts.add_option("lightdiffusionflow-language",
    shared.OptionInfo(
      "default",
      "显示语言/language", 
      gr.Dropdown, 
      lambda: {
        "choices": ["default","中文","english"]
      }, section=section)
  )

  shared.opts.add_option("lightdiffusionflow-mode",
    shared.OptionInfo(
      "All",
      f"模式/mode: ({OutputPrompt.note_for_save_mode()})",
      gr.Dropdown, 
      lambda: {
        "choices": ["Core","All"]
      }, section=section)
  )

  shared.opts.add_option("lightdiffusionflow-auto-fix-params",
    shared.OptionInfo(
      True,
      f"自动纠正错误的参数/Automatically fix incorrect parameters",
      gr.Checkbox, 
      {"interactive": True}, 
      section=section)
  )

scripts.script_callbacks.on_ui_settings(on_ui_settings)
