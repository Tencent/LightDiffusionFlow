<p float="left">
    <img alt="" src="https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E" />
    <img alt="" src="https://img.shields.io/badge/Python-FFD43B?style=for-the-badge&logo=python&logoColor=blue" />
</p>

# sd-webui-lightdiffusionflow

[**English**](./README.md) | [**中文**](./README_CN.md)

这是为[Stable Diffusion Web UI](https://github.com/AUTOMATIC1111/stable-diffusion-webui) 开发的一款导入/导出参数选项的插件。  
Stable Diffusion Web UI 以下简称 SD Web UI。  
* [**插件效果演示和其他说明**](https://fvkij7wuqx9.feishu.cn/docx/HgZndihraotmmzxFni7cFZISnvb)  
* [**Lightflow开源社区**](https://www.lightflow.ai/)
* [**Discord**](https://discord.gg/CaD4mchHxW)  
* [**Twitter: @LightFlow_AI**](https://twitter.com/LightFlow_AI)  

### 功能

* 实现单个文件导入/导出SD Web UI参数选项。
* 支持解析图片的PNG Info，并自动将参数恢复到SD Web UI面板上，包括部分插件参数。
* 目前支持的插件：
    - 理论上来说，目前可以支持所有插件。  
    部分插件的图片参数除外，因为必须要有对应的elem_id。

![lightflow_CN](https://github.com/Tencent/LightDiffusionFlow/assets/20501414/492f7408-7729-4370-b0f9-c17a80211029)

### 安装

粘贴本项目链接到 **Install from URL** 选项里，点击安装按钮即可。

### 插件依赖项

无

### 用法

* 导出配置：
    - 在SD Web UI上设置好合适的选项，点击Export按钮即可导出记录了当前设置的flow文件。
* 导入配置：
    - 在SD Web UI上，点击文件框选择对应的flow文件，即可导入文件中的设置。
    - 也可以直接把flow文件拖入文件框内完成导入。

**目前，该插件支持SD WebUI v1.5及以上版本，尚未对早期版本进行兼容性测试。**  
**如果不是因为基本功能的兼容性问题，强烈建议在使用此插件之前升级到v1.6或更高版本。**
### 注意事项

* 每次导入新的flow文件之前，最好刷新一下SD Web UI页面，因为插件只会修改已保存的参数选项。
* 插件当前版本不支持秋叶启动器的"云端汉化选项"，使用本插件时建议关闭。

### 插件共建

如果你对我们的项目有意见、建议或者使用中遇到问题，欢迎通过 issue 给我们提出，也欢迎随时发起PR!

### 感谢

本项目参考和引用的第三方代码开源许可放在 LICENSES/[**Licenses.md**](./LICENSES/Licenses.md)

- stable-diffusion-webui-state - https://github.com/ilian6806/stable-diffusion-webui-state

    *我们团队急需一个能快速分享 SD Web UI 设置的解决方案，Ilian Iliev 的 stable-diffusion-webui-state 项目为我们提供了很大的帮助，感谢 Ilian Iliev！*

- 非常感谢 [Hali](https://github.com/ThisHaliHali) 为本项目提供的灵感、建议以及在开发期间的各种支持！
