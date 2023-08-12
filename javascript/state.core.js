window.state = window.state || {};
state = window.state;

state.core = (function () {

    const TABS = ['txt2img', 'img2img'];
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
        'seed': 'seed'
    };

    const ELEMENTS_WITHOUT_PREFIX = {
        'resize_mode': 'resize_mode'
    };

    const SELECTS = {
        'sampling': 'sampling',
        'hires_upscaler': 'hr_upscaler',
        'script': '#script_list',
    };

    const SELECTS_WITHOUT_PREFIX = {
        'setting_sd_model_checkpoint': 'setting_sd_model_checkpoint'
    };



    const MULTI_SELECTS = {
        'styles': 'styles'
    };

    const TOGGLE_BUTTONS = {
        'extra_networks': 'extra_networks',
    };
    
    var IMAGES_WITHOUT_PREFIX = {
    };

    let store = null;

    function hasSetting(id, tab) {
        return true // 需要默认保存全部选项 不需要判断
        const suffix = tab ? `_${tab}` : '';
        return this[`state${suffix}`] && this[`state${suffix}`].indexOf(id) > -1;
    }

    
    let img_elem_keys=[];
    let localization_dict={};

    function get_localization_dict(){
        return localization_dict
    }

    function init() {
        
        fetch('/state/refresh_ui') // 刷新页面触发python重置图片数据

        fetch('/state/get_imgs_elem_key') //初始化部分图片组件id, 后续设置onchanged事件
        .then(response => response.json())
        .then(data => {
            img_elem_keys = data.split(",")
            console.log("get_imgs_elem_key")
            img_elem_keys.forEach(key => {
                IMAGES_WITHOUT_PREFIX[key] = key
            });
            
            // 等上面的组件ID同步过来后 再加载其他配置
            fetch('/state/config.json?_=' + (+new Date()))
                .then(response => response.json())
                .then(config => {
                    // console.log("-------------state.core.init----------------")
                    
                    try {
                        store = new state.Store();
                        store.clear();
                        load(config);

                    } catch (error) {
                        console.error('[state]: Error:', error);
                    }
                })
                .catch(error => console.error('[state]: Error getting JSON file:', error));
        });

        fetch('/state/get_localization') // 读取本地化内容
        .then(response => response.json())
        .then(json_obj => {
            console.log(`localization  ${localization_dict}`)     
            localization_dict = json_obj
            //console.log(`localization    ${localization_dict['Preprocessor']}`)            
            // Object.keys(localization_dict).forEach(function(key) {
            //     console.log("=================================")
            //     console.log(key +': '+ localization_dict[key]);
            // });
        });

    }
    
    // function forEachImageElement(list, action) {
    //     for (const [settingId, element] of Object.entries(list)) {
    //         TABS.forEach(tab => {
    //             //if (config.hasSetting(settingId, tab)) {
    //                 action(element, tab);
    //             //}
    //         });
    //     }
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
        
        forEachElement_WithoutTabs(SELECTS_WITHOUT_PREFIX, (element) => {
            handleSavedSelects(element);
        });

        forEachElement(ELEMENTS, config, (element, tab) => {
            handleSavedInput(`${tab}_${element}`);
        });

        forEachElement_WithoutTabs(ELEMENTS_WITHOUT_PREFIX, (element) => {
            handleSavedInput(`${element}`);
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

    //     let inputId = 'state-import-file-inline';

    //     let importBtn = createHeaderButton(title,text, className, {
    //         display: 'none'
    //     }, () => {
    //         actions.importState(inputId);
    //     });

    //     let label = state.utils.html.create('label', {}, { cursor: 'pointer' });
    //     label.appendChild(state.utils.html.create('input', {
    //         type: 'file',
    //         id: inputId,
    //         accept: 'application/json',
    //     }, {
    //         display: 'none'
    //     }));
    //     label.appendChild(document.createTextNode(text));
    //     label.addEventListener('change', () => {
    //         importBtn.dispatchEvent(new Event('click'));
    //     });

    //     let button = createHeaderButton(title, '', className, {});
    //     button.appendChild(label);

    //     return {
    //         hiddenButton: importBtn,
    //         button: button
    //     };
    // }

    // function loadUI() {
    //     let quickSettings = gradioApp().getElementById("quicksettings");
    //     let className = quickSettings.querySelector('button').className;
    //     quickSettings.appendChild(createHeaderButton('State: Reset', "*️⃣", className, {}, actions.resetAll));
    //     quickSettings.appendChild(createHeaderButton('State: Export',"📤", className, {}, actions.exportState));
    //     quickSettings.appendChild(createHeaderButton('State: test',"📤", className, {}, actions.test));
    //     let fileInput = createHeaderFileInput('State: Import',"📥", className);
    //     quickSettings.appendChild(fileInput.hiddenButton);
    //     quickSettings.appendChild(fileInput.button);
    // }


    function restoreTabs(config) {

        if (! config.hasSetting('tabs')) {
            return;
        }

        const tabs = gradioApp().querySelectorAll('#tabs > div:first-child button');
        const value = store.get('tab');
        //console.log(tabs)
        //console.log(value)
        if (value) {
            for (var i = 0; i < tabs.length; i++) {
                if (tabs[i].textContent === state.utils.localize(localization_dict, value)) {
                    state.utils.triggerEvent(tabs[i], 'click');
                    break;
                }
            }
        }

        // Use this when onUiTabChange is fixed
        // onUiTabChange(function () {
        //     store.set('tab', gradioApp().querySelector('#tabs .tab-nav button.selected').textContent);
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
        //console.log("-------------state.core.storeTab----------------")
        store.set('tab', state.utils.internationalize(localization_dict, gradioApp().querySelector('#tabs .tab-nav button.selected').textContent));
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

        // 不能直接屏蔽设置选项相关的操作，会没法使用加载配置的功能
        forEach(function (event) {
            state.utils.setValue(this, value, event);
        });
    }

    function handleSavedSelects(id) {
        state.utils.handleSelect(getElement(id), id, store);
    }

    function handleSavedMultiSelects(id) {
        const select = gradioApp().getElementById(`${id}`);
        state.utils.handleMultipleSelect(select, id, store);
    }

    function handleSavedImage(id) {
        state.utils.handleImage(getElement(id), id, store);
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
        //     config['state_extensions'].forEach(function (ext) {
        //         if (ext in state.extensions) {
        //             state.extensions[ext].init();
        //         }
        //     });
        // }

        for (const [name, obj] of Object.entries(state.extensions)) {
            if(Object.keys(localization_dict).length > 0){obj.set_localization(localization_dict)}
            obj.init();
        }

    }

    // function handleSettingsPage() {  // settings   state 界面 绑定按钮事件等操作

    //     const page = gradioApp().querySelector('#settings_state');
    //     state.utils.html.setStyle(page.querySelectorAll('fieldset'), {
    //         'marginTop': '20px',
    //         'marginBottom': '10px'
    //     });

    //     let buttonsContainer = gradioApp().querySelector('#settings_state_buttons');
    //     if (buttonsContainer) {
    //         buttonsContainer.parentNode.removeChild(buttonsContainer);
    //     }
    //     buttonsContainer = document.createElement('div');
    //     buttonsContainer.id = 'settings_state_buttons';

    //     let setCheckboxes = function (value, checkFunc) {
    //         checkFunc = checkFunc || function () { return true; };
    //         Array.from(page.querySelectorAll('input[type="checkbox"]')).forEach(function (el) {
    //             if (checkFunc(el)) {
    //                 if (el.checked !== value) {
    //                     el.checked = value;
    //                     state.utils.triggerEvent(el, 'change');
    //                 }
    //             } else if (el.checked === value) {
    //                 el.checked = !value;
    //                 state.utils.triggerEvent(el, 'change');
    //             }
    //         });
    //     };
    //     buttonsContainer.appendChild(state.utils.html.createButton('Select All', function () {
    //         setCheckboxes(true);
    //     }));
    //     buttonsContainer.appendChild(state.utils.html.createButton('Select All Except Seeds', function () {
    //         setCheckboxes(true, function (el) {
    //             return el.nextElementSibling.textContent.indexOf('seed') === -1;
    //         });
    //     }));
    //     buttonsContainer.appendChild(state.utils.html.createButton('Unselect All', function () {
    //         setCheckboxes(false);
    //     }));
    //     state.utils.html.setStyle(buttonsContainer, {
    //         'marginTop': '20px',
    //         'marginBottom': '10px'
    //     });
    //     buttonsContainer.appendChild(state.utils.html.create('hr'));
    //     buttonsContainer.appendChild(state.utils.html.create('div', { innerHTML: 'Actions' }, { marginBottom: '10px' }));
    //     buttonsContainer.appendChild(state.utils.html.createButton('Reset All', actions.resetAll));
    //     buttonsContainer.appendChild(state.utils.html.createButton('Export State', actions.exportState));
    //     buttonsContainer.appendChild(state.utils.html.createButton('Import State', actions.importState));
    //     buttonsContainer.appendChild(state.utils.html.create('input', {
    //         id: 'state-import-file', type: 'file', accept: 'application/json'
    //     }));
    //     page.appendChild(buttonsContainer);
    // }

    let actions = {
        resetAll: function () {
            let confirmed = confirm('Reset all state values?');
            if (confirmed) {
                store.clearAll();
                alert('All state values deleted!');
            }
        },
        exportState: function () {
            state.utils.saveFile('sd-webui-state', store.getAll());
        },
        applyState: function () {
            fetch('/state/config.json?_=' + (+new Date()))
            .then(response => response.json())
            .then(config => {
                try {
                    config.hasSetting = hasSetting
                    //console.log(config)
                    //restoreTabs(config); // 恢复到最后点击的tab页面

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
                        handleSavedImage(element);
                    });
            
                    handleExtensions(config);

                    
                    //handleSettingsPage();
                } catch (error) {
                    console.error('[state]: Error:', error);
                }
            })
            .catch(error => console.error('[state]: Error getting JSON file:', error));
        },
        // importState: function (id) {
        //     //console.log(`==================importState click = ${id}`)
        //     const fileInput = gradioApp().getElementById(id || 'state-import-file');
        //     //console.log(`==================importState click = ${fileInput.files[0]}`)
        //     if (! fileInput.files || ! fileInput.files[0]) {
        //         alert('Please select a JSON file!');
        //         return;
        //     }
        //     const file = fileInput.files[0];
        //     const reader = new FileReader();
        //     reader.onload = function (event) {
        //         store.load(JSON.parse(event.target.result));
        //         actions.applyState()
        //         //window.location.reload();
        //     };
        //     reader.readAsText(file);
        // },
        importLightflow: function (fileInput){
            
            forEachElement_WithoutTabs(IMAGES_WITHOUT_PREFIX, (image_id) => {
                state.utils.clearImage(getElement(image_id));
            });
            
            if ( ! fileInput[0]) {
                alert('Please select a JSON file!');
                return;
            }
            const file = fileInput[0].blob;
            const reader = new FileReader();
            reader.onload = function (event) {

                let json_obj = JSON.parse(event.target.result)
                forEachElement_WithoutTabs(IMAGES_WITHOUT_PREFIX, (image_id) => {
                    json_obj[image_id] = ""
                });
                // webui主界面 没有localization相关的兼容问题 所以不用管
                store.clear();
                console.log(json_obj)
                store.load(json_obj);
                actions.applyState()
                //window.location.reload();
            };
            reader.readAsText(file);
            return fileInput
        },
        startImportImage: function (index){

            switch_tab_dict = {
                "txt2img_invisible_img2img_image": "switch_to_img2img()",
                "txt2img_invisible_img2img_sketch": "switch_to_sketch()",
                "txt2img_invisible_img2maskimg": "switch_to_inpaint()",
                "txt2img_invisible_inpaint_sketch": "switch_to_inpaint_sketch()",
                "txt2img_invisible_img_inpaint_base": "state.utils.switch_to_img_inpaint()",
                "txt2img_invisible_img_inpaint_mask": "state.utils.switch_to_img_inpaint()",
                "txt2img_invisible_txt2img_controlnet_ControlNet_input_image": "state.utils.switch_to_txt2img_ControlNet(0)",
                "txt2img_invisible_img2img_controlnet_ControlNet_input_image": "state.utils.switch_to_img2img_ControlNet(0)"
                //"txt2img_controlnet_ControlNet-0_input_image": "switch_to_txt2img_ControlNet(0)",
                //"img2img_controlnet_ControlNet-0_input_image": "switch_to_img2img_ControlNet(0)"
            }
            
            for (let i = 0; i < 10; i++) {
                switch_tab_dict[`txt2img_invisible_txt2img_controlnet_ControlNet-${i}_input_image`] = `state.utils.switch_to_txt2img_ControlNet(${i})`
                switch_tab_dict[`txt2img_invisible_img2img_controlnet_ControlNet-${i}_input_image`] = `state.utils.switch_to_img2img_ControlNet(${i})`
            }

            state.utils.sleep(300).then(() => {

                console.log(index)
                try{
                    key = "txt2img_invisible_"+img_elem_keys[Number(index)+1]
                    console.log(key)
                    eval( switch_tab_dict[key] ) // 跳转界面
                    const button = gradioApp().getElementById(key);
                    button.click();
                } catch (error) {
                    console.warn('[startImportImage]: Error:', error);
                }

                //switch_to_img2img_tab()
                // switch(index) {
                //     case '-1':
                //         switch_to_img2img();
                //         const button = gradioApp().getElementById("txt2img_invisible_img2img_image");
                //         button.click();
                //         break;
                //     case '0':
                //         switch_to_sketch()
                //         const button2 = gradioApp().getElementById("txt2img_invisible_img2img_sketch")
                //         button2.click()
                //         break;
                //     case '1':
                //         switch_to_inpaint()
                //         const button3 = gradioApp().getElementById("txt2img_invisible_img2maskimg") // inpaint
                //         button3.click()
                //         break;
                //     case '2':
                //         switch_to_inpaint_sketch()
                //         const button4 = gradioApp().getElementById("txt2img_invisible_inpaint_sketch") // inpaint_sketch
                //         button4.click()
                //         break;
                //     default:
                //         console.log('doing nothing~~')
                //         break;
                // }

            });

        }
    };

    return { init,actions,get_localization_dict };
}());
