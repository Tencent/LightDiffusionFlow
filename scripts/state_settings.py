import gradio as gr
import modules.shared as shared
from modules import scripts


def on_ui_settings():

    section = ("state", "State")

    shared.opts.add_option("state",
        shared.OptionInfo(
            [],
            "Saved main elements", 
            gr.CheckboxGroup, 
            lambda: {
                "choices": ["tabs"]
            }, section=section)
    )

    shared.opts.add_option("state_txt2img",
        shared.OptionInfo(
            [], 
            "Saved elements from txt2img",
            gr.CheckboxGroup,
            lambda: {
                "choices": [
                    "prompt",
                    "negative_prompt",
                    "extra_networks",
                    "styles",
                    "sampling",
                    "sampling_steps",
                    "width",
                    "height",
                    "batch_count",
                    "batch_size",
                    "cfg_scale",
                    "seed",
                    "restore_faces",
                    "tiling",
                    "hires_fix",
                    "hires_upscaler",
                    "hires_steps",
                    "hires_scale",
                    "hires_resize_x",
                    "hires_resize_y",
                    "hires_denoising_strength",
                    "script"
                ]
            }, section=section)
    )

    shared.opts.add_option("state_img2img", 
        shared.OptionInfo(
            [], 
            "Saved elements from img2img",
            gr.CheckboxGroup,
            lambda: {
                "choices": [
                    "prompt",
                    "negative_prompt",
                    "extra_networks",
                    "styles",
                    "sampling",
                    "resize_mode",
                    "sampling_steps",
                    "restore_faces",
                    "tiling",
                    "width",
                    "height",
                    "batch_count",
                    "batch_size",
                    "cfg_scale",
                    "denoising_strength",
                    "seed",
                    "script"
                ]
            }, section=section)
    )

    shared.opts.add_option("state_extensions",
        shared.OptionInfo(
            [], 
            "Saved elements from extensions",
            gr.CheckboxGroup,
            lambda: {
                "choices": [
                    "control-net"
                ]
            }, section=section)
    )


# scripts.script_callbacks.on_ui_settings(on_ui_settings)
