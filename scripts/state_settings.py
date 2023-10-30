import gradio as gr
import modules.shared as shared
from modules import scripts


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

scripts.script_callbacks.on_ui_settings(on_ui_settings)
