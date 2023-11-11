window.state = window.state || {};
state = window.state;


state.core = (function () {

  const TABS = ['txt2img', 'img2img'];

  // settingId, element
  const ELEMENTS = {
    'prompt': 'prompt',
    'negative_prompt': 'neg_prompt',
    'sampling_steps': 'steps',
    'restore_faces': 'restore_faces',
    'tiling': 'tiling',
    'hires_fix': 'enable_hr',
    'hires_steps': 'hires_steps',
    'hires_scale': 'hr_scale',
    'hires_resize_x': 'hr_resize_x',
    'hires_resize_y': 'hr_resize_y',
    'hires_denoising_strength': 'denoising_strength',
    'width': 'width',
    'height': 'height',
    'batch_count': 'batch_count',
    'batch_size': 'batch_size',
    'cfg_scale': 'cfg_scale',
    'denoising_strength': 'denoising_strength',
    'seed': 'seed',
    'sampling': 'sampling',
    'switch_at': 'switch_at'
  };

  const ACCORDION = {
    "hires_fix": "hr",
    "refiner": "enable"
  }

  const ELEMENTS_WITHOUT_PREFIX = {
    'resize_mode': 'resize_mode',
    'setting_inpainting_mask_weight': 'setting_inpainting_mask_weight',
    'setting_CLIP_stop_at_last_layers': 'setting_CLIP_stop_at_last_layers',
    'setting_eta_noise_seed_delta': 'setting_eta_noise_seed_delta',
    'img2img_mask_blur': 'img2img_mask_blur',
    'img2img_mask_mode': 'img2img_mask_mode',
    'img2img_inpainting_fill': 'img2img_inpainting_fill',
    'img2img_inpaint_full_res_padding': 'img2img_inpaint_full_res_padding',
    'img2img_inpaint_full_res': 'img2img_inpaint_full_res',
    'img2img_mask_alpha': 'img2img_mask_alpha'
    //'generation_info_txt2img': 'generation_info_txt2img' // 可能因为是visible=false 所以触发不了onchange事件？
  };

  const SELECTS = {
    'sampling': 'sampling',
    'hires_upscaler': 'hr_upscaler',
    'script': '#script_list',
    'checkpoint': 'checkpoint',
  };

  const SELECTS_WITHOUT_PREFIX = {
    'setting_sd_model_checkpoint': 'setting_sd_model_checkpoint',
    'setting_sd_vae': 'setting_sd_vae'
  };

  const MULTI_SELECTS = {
    'styles': 'styles'
  };

  const TOGGLE_BUTTONS = {
    'extra_networks': 'extra_networks',
  };
  
  var IMAGES_WITHOUT_PREFIX = {
  };

  const ELEMENTS_ALWAYS_SAVE = {
    'setting_sd_model_checkpoint': 'setting_sd_model_checkpoint',
  };

  const Image_extensions = [".png", ".jpg", ".jpeg"]

  let store = null;
  let timer = null;
  let inited = false
  let sd_versions = "0.0.0"

  function hasSetting(id, tab) {
    return true // 需要默认保存全部选项 不需要判断
    const suffix = tab ? `_${tab}` : '';
    return this[`state${suffix}`] && this[`state${suffix}`].indexOf(id) > -1;
  }

  function fn_timer(){

    // if(inited){ 
      fetch('/lightdiffusionflow/local/need_preload')
      .then(response => response.json())
      .then(data => {
        //console.log(`fn_timer`)
        if (data != ""){
          //state.core.actions.handleLightDiffusionFlow([{"name":data}]);
          const btn1 = gradioApp().querySelector(`button#set_lightdiffusionflow_file`);
          state.utils.triggerMouseEvent(btn1);
          setTimeout(() => {
            const btn2 = gradioApp().querySelector(`button#preload_button`);
            state.utils.triggerMouseEvent(btn2);
          }, 1000);
        }
      }).catch(function(e) {
        clearInterval(timer)
        console.log("Oops, error");
      });
    // }
    // else{

    //   fetch('/lightdiffusionflow/local/get_imgs_elem_key') //初始化部分图片组件id, 后续设置onchanged事件
    //   .then(response => response.json())
    //   .then(data => {
    //     console.log('-----------------------------')
    //     console.log(data)
    //     console.log('-----------------------------')
    //     if(data != ""){

    //       img_elem_keys = data.split(",")
    //       img_elem_keys.forEach(key => {
    //         IMAGES_WITHOUT_PREFIX[key] = key
    //       });
          
    //       // 等上面的组件ID同步过来后 再加载其他配置
    //       fetch('/lightdiffusionflow/local/config.json?_=' + (+new Date()))
    //       .then(response => response.json())
    //       .then(config => {          
    //         try {
    //           store = new state.Store();
    //           store.clearAll();
    //           load(config);
    //           inited = true
    //         } catch (error) {
    //           console.error('[state]: Error:', error);
    //         }
    //       })
    //       .catch(error => console.error('[state]: Error getting JSON file:', error));
    //     }
    //   });
        

    // }
      
  }

  let img_elem_keys=[];
  let ext_list=[];
  let flow_save_mode = "Core"

  function get_imgs_elem_key(){

    fetch('/lightdiffusionflow/local/get_imgs_elem_key') //初始化部分图片组件id, 后续设置onchanged事件
      .then(response => response.json())
      .then(data => {
        console.log(data)
        if(data == ''){
          console.log('-----------------------------')
          setTimeout(() => {
            get_imgs_elem_key()
          }, 500);
        }
        else{
          img_elem_keys = data.split(",")
          img_elem_keys.forEach(key => {
            IMAGES_WITHOUT_PREFIX[key] = key
          });
          
          fetch('/lightdiffusionflow/local/get_ext_list')
          .then(response => response.json())
          .then(data => {
            ext_list = data.split(",")
          });
          
          // 等上面的组件ID同步过来后 再加载其他配置
          fetch('/lightdiffusionflow/local/config.json?_=' + (+new Date()))
            .then(response => response.json())
            .then(config => {
              try {
                
                try{
                  flow_save_mode = config['lightdiffusionflow-mode']
                }catch (error) {
                  flow_save_mode = "Core"
                }

                store = new state.Store();
                store.clearAll();
                load(config);
                timer = window.setInterval(fn_timer,1000); // 初始化页面完成后再启动timer读取文件
              } catch (error) {
                console.error('[state]: Error:', error);
              }
            })
            .catch(error => console.error('[state]: Error getting JSON file:', error));
        }
      });

  }

  function init() {
    
    //console.log(window.localization)
    fetch('/lightdiffusionflow/local/refresh_ui') // 刷新页面触发python重置图片数据
    .then(response => response.json())
    .then(data => {
      sd_versions = data
    });

    get_imgs_elem_key()

  }
  
  // function forEachImageElement(list, action) {
  //   for (const [settingId, element] of Object.entries(list)) {
  //     TABS.forEach(tab => {
  //       //if (config.hasSetting(settingId, tab)) {
  //         action(element, tab);
  //       //}
  //     });
  //   }
  // }

  function forEachElement_WithoutTabs(list, action) {
    for (const [settingId, element] of Object.entries(list)) {
      action(element);
    }
  }

  function forEachElement(list, config, action) {
    for (const [settingId, element] of Object.entries(list)) {
      TABS.forEach(tab => {
        if (config.hasSetting(settingId, tab)) {
          action(element, tab);
        }
      });
    }
  }

  function load(config) {
    config.hasSetting = hasSetting

    //loadUI(); // 往页面上添加按钮

    forEachElement(ACCORDION, config, (element, tab) => {
      handleSavedAccordion(`${tab}_${element}`);
    });

    forEachElement_WithoutTabs(SELECTS_WITHOUT_PREFIX, (element) => {
      handleSavedSelects(element);
    });

    forEachElement(ELEMENTS, config, (element, tab) => {
      handleSavedInput(`${tab}_${element}`);
    });

    forEachElement_WithoutTabs(ELEMENTS_WITHOUT_PREFIX, (element) => {
      handleSavedInput(element);
    });

    forEachElement(SELECTS, config, (element, tab) => {
      handleSavedSelects(`${tab}_${element}`);
    });

    forEachElement(MULTI_SELECTS, config, (element, tab) => {
      handleSavedMultiSelects(`${tab}_${element}`);
    });

    forEachElement(TOGGLE_BUTTONS, config, (element, tab) => {
      handleToggleButton(`${tab}_${element}`);
    });

    forEachElement_WithoutTabs(IMAGES_WITHOUT_PREFIX, (element) => {
      handleSavedImage(`${element}`);
    });

    handleExtensions(config);
    //handleSettingsPage();

    restoreTabs(config); // 恢复到最后点击的tab页面

    forEachElement_WithoutTabs(ELEMENTS_ALWAYS_SAVE, (element) => {
      state.utils.forceSaveSelect(getElement(element), element, store); //每次无论有没有修改都需要导出的选项
    });
  }

  function createHeaderButton(title, text, className, style, action) {

    const button = state.utils.html.create('button', {
      title: title,
      innerHTML: text,
      className: className,
    }, style);

    if (action) {
      button.addEventListener('click', action);
    }

    return button;
  }

  // function createHeaderFileInput(title, text, className) {

  //   let inputId = 'state-import-file-inline';

  //   let importBtn = createHeaderButton(title,text, className, {
  //     display: 'none'
  //   }, () => {
  //     actions.importState(inputId);
  //   });

  //   let label = state.utils.html.create('label', {}, { cursor: 'pointer' });
  //   label.appendChild(state.utils.html.create('input', {
  //     type: 'file',
  //     id: inputId,
  //     accept: 'application/json',
  //   }, {
  //     display: 'none'
  //   }));
  //   label.appendChild(document.createTextNode(text));
  //   label.addEventListener('change', () => {
  //     importBtn.dispatchEvent(new Event('click'));
  //   });

  //   let button = createHeaderButton(title, '', className, {});
  //   button.appendChild(label);

  //   return {
  //     hiddenButton: importBtn,
  //     button: button
  //   };
  // }

  // function loadUI() {
  //   let quickSettings = gradioApp().getElementById("quicksettings");
  //   let className = quickSettings.querySelector('button').className;
  //   quickSettings.appendChild(createHeaderButton('State: Reset', "*️⃣", className, {}, actions.resetAll));
  //   quickSettings.appendChild(createHeaderButton('State: Export',"📤", className, {}, actions.exportState));
  //   quickSettings.appendChild(createHeaderButton('State: test',"📤", className, {}, actions.test));
  //   let fileInput = createHeaderFileInput('State: Import',"📥", className);
  //   quickSettings.appendChild(fileInput.hiddenButton);
  //   quickSettings.appendChild(fileInput.button);
  // }


  function restoreTabs(config) {

    if (! config.hasSetting('tabs')) {
      return;
    }

    const tabs = gradioApp().querySelectorAll('#tabs > div:first-child button');
    const value = store.get('tab');
    if (value) {
      for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].textContent === state.utils.getTranslation(value)) {
          state.utils.triggerEvent(tabs[i], 'click');
          break;
        }
      }
    }

    // Use this when onUiTabChange is fixed
    // onUiTabChange(function () {
    //   store.set('tab', gradioApp().querySelector('#tabs .tab-nav button.selected').textContent);
    // });
    bindTabClickEvents();
  }

  function bindTabClickEvents() {
    Array.from(gradioApp().querySelectorAll('#tabs .tab-nav button')).forEach(tab => {
      tab.removeEventListener('click', storeTab);
      tab.addEventListener('click', storeTab);
    });
  }

  function storeTab() {
    let tab_name = gradioApp().querySelector('#tabs .tab-nav button.selected').textContent;
    store.set('tab', state.utils.reverseTranslation(tab_name)[0]);
    bindTabClickEvents(); // dirty hack here...
  }

  function getElement(id) {
    for (let i = 0; i < TABS.length; i++) {
      if (id.startsWith(`${TABS[i]}_#`)) {
        // handle elements with same ids in different tabs...
        return gradioApp().querySelector('#tab_' + id.replace(`${TABS[i]}_#`, `${TABS[i]} #`));
      }
    }
    return gradioApp().getElementById(id);
  }

  function handleSavedInput(id) {

    const elements = gradioApp().querySelectorAll(`#${id} textarea, #${id} input, #${id} img`);
    const events = ['change', 'input'];

    if (! elements || ! elements.length) {
      return;
    }
    
    let forEach = function (action) {
      events.forEach(function(event) {
        elements.forEach(function (element) {
          action.call(element, event);
        });
      });
    };

    forEach(function (event) {
      this.addEventListener(event, function () {
        let value = this.value;
        if (this.type && this.type === 'checkbox') {
          value = this.checked;
        }
        else if (this.className === 'img') {
          value = this.checked;
        }
        store.set(id, value);
      });
    });

    TABS.forEach(tab => {
      const seedInput = gradioApp().querySelector(`#${tab}_seed input`);
      ['random_seed', 'reuse_seed'].forEach(id => {
        const btn = gradioApp().querySelector(`#${tab}_${id}`);
        btn.addEventListener('click', () => {
          setTimeout(() => {
            state.utils.triggerEvent(seedInput, 'change');
          }, 100);
        });
      });
    });

    let value = store.get(id);
    if (! value) {
      return;
    }
    forEach(function (event) {
      state.utils.setValue(this, value, event);
    });
  }

  function handleSavedSelects(id) {
    state.utils.handleSelect(getElement(id), id, store, force=false);
  }

  function handleSavedAccordion(id) {
    state.utils.handleAccordion(getElement(id), id, store);
  }

  function handleSavedMultiSelects(id) {
    const select = gradioApp().getElementById(`${id}`);
    state.utils.handleMultipleSelect(select, id, store);
  }

  function handleSavedImage(id) {
    state.utils.handleImage(getElement(id), id, store); // 图片有修改就发回到python保存
  }

  function handleToggleButton(id) {
    const btn = gradioApp().querySelector(`button#${id}`);
    if (! btn) { return; }
    // legionfu
    if (store.get(id) === 'true') {
      state.utils.triggerMouseEvent(btn);
    }
    btn.addEventListener('click', function () {
      store.set(id, Array.from(this.classList).indexOf('secondary-down') === -1);
    });
  }

  function handleExtensions(config) {
    // if (config['state_extensions']) {
    //   config['state_extensions'].forEach(function (ext) {
    //     if (ext in state.extensions) {
    //       state.extensions[ext].init();
    //     }
    //   });
    // }

    for (const [name, obj] of Object.entries(state.extensions)) {
      obj.init(flow_save_mode == "Core");
    }

  }

  // function handleSettingsPage() {  // settings   state 界面 绑定按钮事件等操作

  //   const page = gradioApp().querySelector('#settings_state');
  //   state.utils.html.setStyle(page.querySelectorAll('fieldset'), {
  //     'marginTop': '20px',
  //     'marginBottom': '10px'
  //   });

  //   let buttonsContainer = gradioApp().querySelector('#settings_state_buttons');
  //   if (buttonsContainer) {
  //     buttonsContainer.parentNode.removeChild(buttonsContainer);
  //   }
  //   buttonsContainer = document.createElement('div');
  //   buttonsContainer.id = 'settings_state_buttons';

  //   let setCheckboxes = function (value, checkFunc) {
  //     checkFunc = checkFunc || function () { return true; };
  //     Array.from(page.querySelectorAll('input[type="checkbox"]')).forEach(function (el) {
  //       if (checkFunc(el)) {
  //         if (el.checked !== value) {
  //           el.checked = value;
  //           state.utils.triggerEvent(el, 'change');
  //         }
  //       } else if (el.checked === value) {
  //         el.checked = !value;
  //         state.utils.triggerEvent(el, 'change');
  //       }
  //     });
  //   };
  //   buttonsContainer.appendChild(state.utils.html.createButton('Select All', function () {
  //     setCheckboxes(true);
  //   }));
  //   buttonsContainer.appendChild(state.utils.html.createButton('Select All Except Seeds', function () {
  //     setCheckboxes(true, function (el) {
  //       return el.nextElementSibling.textContent.indexOf('seed') === -1;
  //     });
  //   }));
  //   buttonsContainer.appendChild(state.utils.html.createButton('Unselect All', function () {
  //     setCheckboxes(false);
  //   }));
  //   state.utils.html.setStyle(buttonsContainer, {
  //     'marginTop': '20px',
  //     'marginBottom': '10px'
  //   });
  //   buttonsContainer.appendChild(state.utils.html.create('hr'));
  //   buttonsContainer.appendChild(state.utils.html.create('div',
  //    { innerHTML: 'Actions' },
  //    { marginBottom: '10px' }));
  //   buttonsContainer.appendChild(state.utils.html.createButton('Reset All', actions.resetAll));
  //   buttonsContainer.appendChild(state.utils.html.createButton('Export State', actions.exportState));
  //   buttonsContainer.appendChild(state.utils.html.createButton('Import State', actions.importState));
  //   buttonsContainer.appendChild(state.utils.html.create('input', {
  //     id: 'state-import-file', type: 'file', accept: 'application/json'
  //   }));
  //   page.appendChild(buttonsContainer);
  // }

  let actions = {
    // resetAll: function () {
    //   let confirmed = confirm('Reset all state values?');
    //   if (confirmed) {
    //     store.clearAll();
    //     alert('All state values deleted!');
    //   }
    // },
    applyState: async function () {
      console.log("applyState")
      await fetch('/lightdiffusionflow/local/config.json?_=' + (+new Date()))
        .then(response => response.json())
        .then(config => {
          try {
            config.hasSetting = hasSetting
            
            try{
              flow_save_mode = config['lightdiffusionflow-mode']
            }catch (error) {
              flow_save_mode = "Core"
            }
            //console.log(config)
            //restoreTabs(config); // 恢复到最后点击的tab页面
            load(config);
            // forEachElement_WithoutTabs(SELECTS_WITHOUT_PREFIX, (element) => {
            //   handleSavedSelects(element);
            // });

            // forEachElement(ELEMENTS, config, (element, tab) => {
            //   handleSavedInput(`${tab}_${element}`);
            // });

            // forEachElement_WithoutTabs(ELEMENTS_WITHOUT_PREFIX, (element) => {
            //   handleSavedInput(element);
            // });

            // forEachElement(SELECTS, config, (element, tab) => {
            //   handleSavedSelects(`${tab}_${element}`);
            // });

            // forEachElement(MULTI_SELECTS, config, (element, tab) => {
            //   handleSavedMultiSelects(`${tab}_${element}`);
            // });

            // forEachElement(TOGGLE_BUTTONS, config, (element, tab) => {
            //   handleToggleButton(`${tab}_${element}`);
            // });

            // forEachElement_WithoutTabs(IMAGES_WITHOUT_PREFIX, (element) => {
            //   handleSavedImage(element);
            // });
        
            // handleExtensions(config);

            
            //handleSettingsPage();
          } catch (error) {
            console.error('[state]: Error:', error);
          }
        })
        .catch(error => console.error('[state]: Error getting JSON file:', error));
    },
    
    exportState: function () {
      
      if(state.utils.getCurSeed('txt2img') != undefined){
        store.set(`txt2img_seed`,state.utils.getCurSeed('txt2img'))
      }
      if(state.utils.getCurSeed('img2img') != undefined){
        store.set(`img2img_seed`,state.utils.getCurSeed('img2img'))
      }

      fetch('/lightdiffusionflow/local/lightdiffusionflow_config?onlyimg=true')
        .then(response => response.json())
        .then(config => {
          config = JSON.parse(config)
          stored_config = store.getAll()
          
          for (let key in config){
            if(config[key] != ""){
              stored_config[key] = config[key]
            }
          }

          for (let key in stored_config){
            if(key.indexOf("allow-preview") !== -1 && key.indexOf("ext-control-net") !== -1)
            {
              console.log("allow-preview改成false")
              stored_config[key] = "false"
            }
          }

          var checkTime = function (i) {
            if (i < 10) { i = "0" + i; }
            return i;
          }
          let nowdate = new Date();
          let year = String(nowdate.getFullYear())
          let month = String(checkTime(nowdate.getMonth() + 1))
          let day = String(checkTime(nowdate.getDate()))
          let h = String(checkTime(nowdate.getHours()))
          let m = String(checkTime(nowdate.getMinutes()))
          let s = String(checkTime(nowdate.getSeconds()))
          let time_str = year+month+day+h+m+s

          filename = 'flow-'+time_str+'.flow'
          filename = prompt("Export workflow as:", filename);
          if (!filename) return;
          if (!filename.toLowerCase().endsWith(".flow")) {
            filename += ".flow";
          }
          if(filename != ".flow"){
            // const handle = window.showDirectoryPicker();
            // console.log(handle)
            state.utils.saveFile(filename, stored_config);
          }

        }).catch(error => console.error('[state]: Error getting Flow file:', error));

      //config = JSON.stringify(store.getAll(), null, 4);
      //fetch(`/lightdiffusionflow/local/ExportLightDiffusionFlow?config=${config}`)
    },

    handleLightDiffusionFlow: function (fileInput){
      actions.preset_output_log("start")
      //actions.output_log("<hr style='margin-top:10px;margin-bottom:10px'>Start parsing settings...")
      console.log(fileInput)
      let temp_fileInput = undefined
      try{temp_fileInput = fileInput[0]} catch(error){}
      if ( !temp_fileInput ) {temp_fileInput = fileInput}
      if ( !temp_fileInput ) {
        //alert('Please select a JSON file!');
        actions.preset_output_log("invalid")
        //actions.output_log("Please select a valid lightdiffusionflow or image file!")
        return;
      }

      console.log(temp_fileInput)
      let file_name = temp_fileInput.name;
      console.log(file_name)
      let extension = file_name.substring(file_name.lastIndexOf("."));
      console.log(extension)
      if( Image_extensions.indexOf(extension) != -1 ){
        let data = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            "img_path":file_name
          })
        }
        fetch(`/lightdiffusionflow/local/png_info`, data)
          .then(response => response.json())
          .then(data => {
            console.log(data)
            actions.importLightDiffusionFlow(data)
          });
      }
      else{
        // const file = new Blob([fileInput[0].name]);
        const file = temp_fileInput.blob;
        console.log(file)
        const reader = new FileReader();
        reader.onload = function (event) {
          console.log(event)
          actions.importLightDiffusionFlow(event.target.result)
        };
        try{ reader.readAsText(file); } catch (error) {
          console.log("read from python")
          if(temp_fileInput.name != ""){
            let data = {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                "file_path":temp_fileInput.name
              })
            }
            fetch(`/lightdiffusionflow/local/read_file`, data)
              .then(response => response.json())
              .then(data => {
                //console.log(data)
                actions.importLightDiffusionFlow(data)
              });
          }

        }
      }
      return fileInput
    },
    importLightDiffusionFlow: function (inputData){

      forEachElement_WithoutTabs(IMAGES_WITHOUT_PREFIX, (image_id) => {
        state.utils.clearImage(getElement(image_id));
      });
      
      let json_obj = {}
      try { json_obj = JSON.parse(inputData) } catch (error) {
        actions.preset_output_log("invalid")
        //actions.output_log("Please select a valid lightdiffusionflow or image file!")
        return;
      }

      // 筛选掉默认值参数
      let data = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          "config_data":json_obj
        })
      }
      fetch(`/lightdiffusionflow/local/useless_config_filter`, data)
      .then(response => response.json())
      .then(data => {
        json_obj = data
        console.log(ext_list)
        // 缺少的插件
        missing_ext_list = []
        for (let key in json_obj){
          ext_name = key.match(/ext-(\S+?)-(txt2img|img2img)/)
          console.log(key)
          if(ext_name != null){
            ext_name = ext_name[1]
            console.log(ext_name)
            if(ext_list.indexOf(ext_name) === -1){
              if(missing_ext_list.indexOf(ext_name) === -1){
                missing_ext_list.push(ext_name)
              }
            }
          }
        }

        if(missing_ext_list.length > 0){
          actions.preset_output_log("missing_exts","",missing_ext_list.join(';'))
        }

        forEachElement_WithoutTabs(IMAGES_WITHOUT_PREFIX, (image_id) => {
          json_obj[image_id] = ""
        });
        // webui主界面 没有localization相关的兼容问题 所以不用管
        store.clear();
        store.load(json_obj);
        actions.applyState();
      });
      return;
    },
    startImportImage: function (index){
      index = Number(index)

      //console.log(`-------startImportImage--'${index}'---------------`)
      if(index+1 < img_elem_keys.length){
        //console.log(`---------${img_elem_keys}---------------`)
        //console.log(`---------'${index}'-----'${img_elem_keys.length}'-----------`)
        switch_tab_dict = {
          "img2img_invisible_img2img_image": "switch_to_img2img()",
          "img2img_invisible_img2img_sketch": "switch_to_sketch()",
          "img2img_invisible_img2maskimg": "switch_to_inpaint()",
          "img2img_invisible_inpaint_sketch": "switch_to_inpaint_sketch()",
          "img2img_invisible_img_inpaint_base": "state.utils.switch_to_img_inpaint()",
          "img2img_invisible_img_inpaint_mask": "state.utils.switch_to_img_inpaint()",
          "img2img_invisible_txt2img_controlnet_ControlNet_input_image": "state.utils.switch_to_txt2img_ControlNet(0)",
          "img2img_invisible_img2img_controlnet_ControlNet_input_image": "state.utils.switch_to_img2img_ControlNet(0)"
        }
        
        for (let i = 0; i < 10; i++) {
          switch_tab_dict[`img2img_invisible_txt2img_controlnet_ControlNet-${i}_input_image`] = `state.utils.switch_to_txt2img_ControlNet(${i})`
          switch_tab_dict[`img2img_invisible_img2img_controlnet_ControlNet-${i}_input_image`] = `state.utils.switch_to_img2img_ControlNet(${i})`
        }

        state.utils.sleep(300).then(() => {
          try{
            key = "img2img_invisible_"+img_elem_keys[index+1]
            eval( switch_tab_dict[key] ) // 跳转界面
            const button = gradioApp().getElementById(key);
            button.click();
          } catch (error) {
            console.warn('[startImportImage]: Error:', error);
            if(index+1 < img_elem_keys.length){
              // 图片组件设置出错了，但是需要继续后续的流程
              index = img_elem_keys.length-1
            }
          }
        });
      }

      switch(index+1 - img_elem_keys.length){
        case 0:// 图片导入完成，开始导入Dropdown
          state.utils.sleep(500).then(() => {
            try{
              const button = gradioApp().getElementById("lightdiffusionflow_set_dropdowns");
              button.click();
            } catch (error) {
              console.warn('[set_dropdowns]: Error:', error);
            }
          });
          break
        // case 1:// 触发了导入Dropdown，现在导入其他参数会卡死，触发导入按钮，等下一轮正式开始导入
        //   state.utils.sleep(500).then(() => {
        //     const button = gradioApp().getElementById("lightdiffusionflow_set_js_params");
        //     console.log("lightdiffusionflow_set_js_params")
        //     button.click();
        //   });
        //   break
        // case 2:// 导入其他参数
        //   state.utils.sleep(500).then(() => {
        //     console.log("导入其他参数")
        //     actions.applyState();
        //   });
        //   break
      }
    },
    preset_output_log: function (preset, key="", value=""){
      fetch(`/lightdiffusionflow/local/preset_output_log?preset=${preset}&key=${key}&value=${value}`).then(() => {
        gradioApp().getElementById("img2img_invisible_refresh_log").click();
      });
    },
    output_log: function (msg, msg_style=""){
      fetch(`/lightdiffusionflow/local/output_log?msg=${msg}&style=${msg_style}`).then(() => {
        gradioApp().getElementById("img2img_invisible_refresh_log").click();
      });
    },
    output_warning: function (msg, msg_style="color:Orange;"){
      actions.output_log(msg,msg_style)
    },
    output_error: function (msg, msg_style="color:Red;"){
      actions.output_log(msg,msg_style)
    },
    get_sd_version: function (){
      return sd_versions
    }
  };

  return { init, actions };
}());
