<p float="left">
    <img alt="" src="https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E" />
    <img alt="" src="https://img.shields.io/badge/Python-FFD43B?style=for-the-badge&logo=python&logoColor=blue" />
</p>

# sd-webui-lightdiffusionflow

[**English**](./README.md) | [**中文**](./README_CN.md)

This extension is developed for AUTOMATIC1111's [Stable Diffusion web UI](https://github.com/AUTOMATIC1111/stable-diffusion-webui) that provides import/export options for parameters.  
"Stable Diffusion Web UI" hereafter referred to as "SD Web UI"  
[**Plugin demonstration and other instructions**](https://fvkij7wuqx9.feishu.cn/docx/HgZndihraotmmzxFni7cFZISnvb)  
[**Our open-source community**](https://www.lightflow.ai/)

### Capabilities

* Export/Import web UI parameters with a single file (images, inputs, sliders, checkboxes etc.) .
* Support parsing png info from image and restoring parameters back to the web UI.
* Supported extensions:
    - In theory, it can support any plugin. (Except for certain plugin images, as they require the corresponding elem_id to be provided.)

![lightflow_en](https://github.com/Tencent/LightDiffusionFlow/assets/20501414/e03cc556-9962-41a3-8738-606ee9e38a04)

### Install

Use **Install from URL** option with this repo url. 

### Requirements

*None at all.*

### Usage
 * Export Parameters:  
In the SD Web UI, configure the desired options, and click the "Export" button to export a flow file that records the current parameters.

 * Import Parameters:  
In the SD Web UI, click the "FileBox", select the corresponding flow file, and import the parameters from the file.
You can also directly drag and drop the flow file into the "FileBox" for importing.

### Examples

You can find several official examples in the example/ folder. If you want to try out more possibilities, please visit [**Our open-source community**](https://www.lightflow.ai/) for more public examples. 

### Contributing

If you have any comments, suggestions, or encounter issues with our project, please feel free to raise them through an issue, and we also welcome pull requests at any time!
You are also more than welcomed to share your own LightDiffusionFlow on [**Our open-source community**](https://www.lightflow.ai/). 

### Credits

Licenses for borrowed code can be found in LICENSES/[**Licenses.md**](./LICENSES/Licenses.md)

- stable-diffusion-webui-state - https://github.com/ilian6806/stable-diffusion-webui-state

    *Our team urgently needs a solution to easily share the Stable Diffusion Web UI settings, and Ilian Iliev's stable-diffusion-webui-state project has been a great help to us. Thank you, Ilian Iliev!*

- Big thanks to [Hali](https://github.com/ThisHaliHali) for the inspiration, suggestions, and various forms of support during the development of this project. Much appreciated!
