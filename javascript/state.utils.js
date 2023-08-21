window.state = window.state || {};
state = window.state;

state.utils = {

    
    testFunction: function testFunction() {
        
        // 遍历第一级子节点  每个节点选出一个层级最小且innerText不为空的子节点
        function walks_element(element, cur_gen){
            if(element.innerText != "" && element.innerText != undefined && element.children.length == 0){
                return [[element.innerText,cur_gen]]
            }
            let res = []
            for(child of element.children){
                res = res.concat(walks_element(child,cur_gen+1,res))
            }

            return res
        }

        let cur_tab_name = "txt2img"
        let container = gradioApp().getElementById(cur_tab_name+'_script_container'); // main container

        for (child of container.children){
            res = walks_element(child, 0)
            let min_gen = 10
            let title = undefined
            for(pair of res){
                if(pair[1] < min_gen){
                    min_gen = pair[1]
                    title = pair[0]
                }
            }
            if(title == 'Script'){break}
            console.log(title)
        }

        // function get_child_from_tree(parent, target_gen, cur_gen, condition_fn = undefined){
        //     //console.log(cur_gen)
        //     if(target_gen == cur_gen){
        //         if(condition_fn == undefined){
        //             return Array.from(parent.children)
        //         }
        //         res = []
        //         for (child of parent.children){
        //             if(condition_fn(child)){
        //                 res.push(child)
        //             }
        //         }
        //         //console.log(res)
        //         return res
        //     }
            
        //     target_children = []
        //     for (child of parent.children){
        //         target_children = target_children.concat(get_child_from_tree(child, target_gen, cur_gen+1, condition_fn))
        //     }
        //     //console.log(target_children)
        //     return target_children
        // }

        // }
        
        //const elements = gradioApp().getElementById('html_info_txt2img').querySelectorAll(`#html_info_txt2img`);
        //console.log(elements[0].innerText)

        //console.log("test function")
        //res = "state-txt2img_ext-control-net-0-model".indexOf("txt2img")
        //res1 = "state-txt2img_ext-control-net-0-model".indexOf("txt2img1")
        // res2 = "state-txt2img_ext-control-net-0-model".replace("txt2img123", "文生图/txt2img")
        //console.log(res)
        //console.log(res1)


        // model_str = "deliberate_v2.safetensors [9aba26abdf]"
        // let res = model_str.search(/\[/)
        // console.log(res)

        // res = model_str.search(/\[[0-9A-Fa-f]{10}\]/)
        // console.log(res)
        // console.log(model_str.substring(res,res+12))

        // model_str = "deliberate_v2.safetensors [9aba261abdf]"
        // res = model_str.search(/\[[0-9A-Fa-f]{10}\]/)
        // console.log(res)
        // console.log(model_str.substring(res,res+12))


        // let select = gradioApp().getElementById('setting_sd_model_checkpoint')
        
        // let input = select.querySelector('input');
        // state.utils.triggerMouseEvent(input, 'focus');

        // setTimeout(() => {
        //     let items = Array.from(select.querySelectorAll('ul li'));
        //     console.log(`-----handleSelect--------${items}--------------`)
        //     items.forEach(li => {
        //         console.log(`==========handleSelect======${li.lastChild.wholeText.trim()}===========`)
        //         if (li.lastChild.wholeText.trim() === "deliberate_v2.safetensors [9aba26abdf]") {
        //             state.utils.triggerMouseEvent(li, 'mousedown');
        //             return false;
        //         }
        //     });
        //     state.utils.triggerMouseEvent(input, 'blur');
        // }, 100);

    },

    getTranslation: function getTranslation(key){
        new_key = key
        try{
            if(window.localization[new_key.replace(/^\s+|\s+$/g,"")] != undefined){
                new_key = window.localization[new_key]
                //console.log("getTranslation===========" + key +': '+ new_key);
            }
        } catch (error) {
            console.warn('getTranslation error:', error);
        }
        return new_key
    },

    revokeTranslation: function revokeTranslation(key){
        new_key = []
        try{
            //key=key.replace(/^\s+|\s+$/g,"");
            for (localize_key of Object.keys(window.localization)) {
                //console.log("----------------" + key +': '+ localize_key + '-----' + window.localization[localize_key]);
                if(key.replace(/^\s+|\s+$/g,"") === window.localization[localize_key]){ 
                    tmp_key = localize_key
                    new_key.push(tmp_key)
                    //break
                }
            }
        } catch (error) {
            console.warn('revokeTranslation error:', error);
        }

        //console.log("----------------" + key +': '+ new_key + '-----' + window.localization[new_key]);
        if(new_key.length == 0){new_key.push(key)}
        return new_key
    },

    sleep: function sleep(time) {
        return new Promise((resolve) => setTimeout(resolve, time));
    },

    switch_to_img_inpaint: function switch_to_img_inpaint() {
        switch_to_img2img_tab(4);
        return Array.from(arguments);
    },
    switch_to_txt2img_ControlNet: function switch_to_txt2img_ControlNet(unit) {

        switch_to_txt2img()

        let elem = undefined //gradioApp().getElementById('txt2img_controlnet').children[0].children[1]
        for (child of gradioApp().getElementById('txt2img_controlnet').children){
            if(child.id == "controlnet"){
                elem = child.children[1]
                break;
            }
        }
        if(elem.className.split(' ').pop() != "open"){
            state.utils.triggerMouseEvent(elem, 'click')
        }

        try{
            gradioApp().getElementById('txt2img_controlnet_tabs').querySelectorAll('button')[Number(unit)].click()
        } catch (error) {
            console.warn('[switch_to_txt2img_ControlNet]: Error:', error);
        }
    },
    switch_to_img2img_ControlNet: function switch_to_img2img_ControlNet(unit) {
        
        switch_to_img2img()
        
        let elem = undefined //gradioApp().getElementById('txt2img_controlnet').children[0].children[1]
        for (child of gradioApp().getElementById('img2img_controlnet').children){
            if(child.id == "controlnet"){
                elem = child.children[1]
                break;
            }
        }
        if(elem.className.split(' ').pop() != "open"){
            state.utils.triggerMouseEvent(elem, 'click')
        }
        try{
            gradioApp().getElementById('img2img_controlnet_tabs').querySelectorAll('button')[Number(unit)].click()
        } catch (error) {
            console.warn('[switch_to_img2img_ControlNet]: Error:', error);
        }
    },

    // importState: function () {
    //     let store = new state.Store();
    //     const fileInput = gradioApp().getElementById('state-import-file-inline' || 'state-import-file');
    //     state.utils.triggerMouseEvent(fileInput);
    //     console.log(`==================state.utils importState click = ${fileInput.files[0]}`)
        
    //     setTimeout(() => {
    //         if (! fileInput.files || ! fileInput.files[0]) {
    //             alert('Please select a JSON file!');
    //             return;
    //         }
    //         const file = fileInput.files[0];
    //         const reader = new FileReader();
    //         reader.onload = function (event) {
    //             store.load(JSON.parse(event.target.result));
    //             actions.applyState()
    //             //window.location.reload();
    //         };
    //         reader.readAsText(file);
    //     }, 150);
    // },

    // importLightflow: function () {

    //     fetch('/state/lightflowconfig')
    //         .then(response => response.json())
    //         .then(config => {
    //             let store = new state.Store();
    //             console.log(`lightflowconfig = ${config}`)
    //             store.load(JSON.parse(config));
    //             state.core.actions.applyState();

    //         }).catch(error => console.error('[state]: Error getting JSON file:', error));
    // },
    //exportState: function () {
        // let store = new state.Store();
        // //state.utils.saveFile('sd-webui-state', store.getAll());
        

        // fetch('/state/lightflowconfig?onlyimg=true')
        // .then(response => response.json())
        // .then(config => {
        //     config = JSON.parse(config)
        //     stored_config = store.getAll()
        //     this.getCurSeed('txt2img')
        //     //console.log(config)
        //     //console.log(stored_config)
        //     for (let key in config){
        //         //console.log(config[key])
        //         if(config[key] != ""){
        //             stored_config[key] = config[key]
        //         }
        //     }

        //     var checkTime = function (i) {
        //         if (i < 10) { i = "0" + i; }
        //         return i;
        //     }
        //     let nowdate = new Date();
        //     let year = String(nowdate.getFullYear())
        //     let month = String(checkTime(nowdate.getMonth() + 1))
        //     let day = String(checkTime(nowdate.getDate()))
        //     let h = String(checkTime(nowdate.getHours()))
        //     let m = String(checkTime(nowdate.getMinutes()))
        //     let s = String(checkTime(nowdate.getSeconds()))
        //     let time_str = year+month+day+h+m+s
        //     //console.log(stored_config)
        //     state.utils.saveFile('lightflow-'+time_str, stored_config);

        // }).catch(error => console.error('[state]: Error getting JSON file:', error));

        //config = JSON.stringify(store.getAll(), null, 4);
        //fetch(`/state/ExportLightflow?config=${config}`)
    //},

    triggerEvent: function triggerEvent(element, event) {
        if (! element) {
            return;
        }
        element.dispatchEvent(new Event(event.trim()));
        return element;
    },
    triggerMouseEvent: function triggerMouseEvent(element, event) {
        if (! element) {
            return;
        }
        event = event || 'click';
        element.dispatchEvent(new MouseEvent(event, {
            view: window,
            bubbles: true,
            cancelable: true,
        }));
        return element;
    },
    setValue: function setValue(element, value, event) {
        switch (element.type) {
            case 'checkbox':
                element.checked = value === 'true';
                this.triggerEvent(element, event);
                break;
            case 'radio':
                if (element.value === value) {
                    element.checked = true;
                    this.triggerEvent(element, event);
                } else {
                    element.checked = false;
                }
                break;
            default:
                element.value = value;
                this.triggerEvent(element, event);
        }
    },
    onContentChange: function onContentChange(targetNode, func) {
        const observer = new MutationObserver((mutationsList, observer) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList' || 
                    (mutation.type === 'attributes' && mutation.attributeName == 'src') // 图片被更改
                ) {
                    // console.log(`type = ${mutation.type}`)
                    // console.log(`target = ${mutation.target.id}`)
                    // console.log(`attributeName = ${mutation.attributeName}`)
                    // console.log(`targetNode = ${targetNode.id}`)
                    func(targetNode);
                }
            }
        });
        observer.observe(targetNode, {
            attributes: true,
            childList: true,
            characterData: true,
            subtree: true
        });
    },

    getCurSeed: function getCurSeed(tab) {
        const elements = gradioApp().getElementById(`html_info_${tab}`).querySelectorAll(`#html_info_${tab}`);
        if (! elements || ! elements.length || !elements[0].innerText) {
            return undefined;
        }
        seed = undefined
        values = elements[0].innerText.split(',')
        for (value of values){
            pair = value.split(':')
            if(pair[0].replace(/^\s+|\s+$/g,"") == 'Seed'){
                seed = pair[1].replace(/^\s+|\s+$/g,"")
            }
        }
        return seed
    },

    handleImage: function handleImage(select, id, store) {
        setTimeout(() => {
            //console.log(`------ onContentChange select = ${id}  ${select}  125 -----`)
            state.utils.onContentChange(select, function (el) {
                
                let data = {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        "id":id,
                        "img":""
                    })
                }

                try {
                    // new gradio version...
                    let img = el.querySelector('img');
                    if (img) {
                        data.body = JSON.stringify({
                            "id":id,
                            "img":img.src
                        })
                    }
                } catch (error) {
                    console.warn('[state]: Error:', error);
                }
                
                fetch(`/state/imgs_callback`, data)
            });
        }, 150);
    },

    clearImage: function clearImage(select) {
        try {
            // new gradio version...
            let buttons = select.querySelectorAll('button');
            //console.log(`------ onContentChange select = ${select} ----- ${img.src}`)
            buttons.forEach(button => {
                //console.log(button.getAttribute("aria-label"))
                if(button.getAttribute("aria-label") == "Clear"){
                    button.click();
                    //state.utils.triggerMouseEvent(button, 'mousedown');
                }
            });

        } catch (error) {
            console.error('[state]: Error:', error);
        }
    },
    // handleSelect: function handleSelect(select, id, store) {
    //     try {
    //         let value = store.get(id);
    //         if (value) {
                
    //             let input = select.querySelector('input');
    //             state.utils.triggerMouseEvent(input, 'focus');
                
    //             setTimeout(() => {
    //                 let items = Array.from(select.querySelectorAll('ul li'));
    //                 for (li of items){
    //                     if (li.lastChild.wholeText.trim() === value) {
    //                         state.utils.triggerMouseEvent(li, 'mousedown');
    //                         //return false;
    //                         break
    //                     }
    //                 }
    //                 state.utils.triggerMouseEvent(input, 'blur');
    //             }, 100);
    //         }

    //         setTimeout(() => {
    //             state.utils.onContentChange(select, function (el) {
    //                 let selected = el.querySelector('span.single-select');
    //                 if (selected) {
    //                     store.set(id, selected.textContent);
    //                 } else {
    //                     // new gradio version...
    //                     let input = select.querySelector('input');
    //                     if (input) {
    //                         store.set(id, input.value);
    //                     }
    //                 }
    //             });
    //         }, 150);
    //     } catch (error) {
    //         console.error('[state]: Error:', error);
    //     }
    // },

    forceSaveSelect: function forceSaveSelect(select, id, store) {
        let selected = select.querySelector('span.single-select');
        if (selected) {
            store.set(id, selected.textContent);
        } else {
            // new gradio version...
            let input = select.querySelector('input');
            if (input) {
                store.set(id, input.value);
            }
        }
    },

    handleSelect: function handleSelect(select, id, store) {
        try {
            let value = store.get(id);
            if (value) {
                //console.log(`-----start---handleSelect = ${id} ---${value}----`)
                
                let input = select.querySelector('input');
                state.utils.triggerMouseEvent(input, 'focus');
                
                setTimeout(() => {
                    let items = Array.from(select.querySelectorAll('ul li'));
                    let localized_value = this.getTranslation(value)
                    let successed = false
                    for (li of items){
                        // li.lastChild.wholeText.trim() === value
                        // console.log(`------ handleSelect = ${value} ----- ${localized_value}----${li.lastChild.wholeText.trim()}`)
                        if (localized_value === li.lastChild.wholeText.trim()) {
                            state.utils.triggerMouseEvent(li, 'mousedown');
                            successed = true
                            break
                        }
                    }

                    if(!successed && localized_value.search(/\[[0-9A-Fa-f]{10}\]/) != -1){ //找不到对应选项 并且选项里有10位哈希值
                        for (li of items){ // 考虑模型同名但是不同hash的情况
                            localized_value = localized_value.replace(/\[[0-9A-Fa-f]{10}\]/,"")
                            child_text = li.lastChild.wholeText.trim().replace(/\[[0-9A-Fa-f]{10}\]/, "")
                            if (localized_value === child_text) {
                                state.utils.triggerMouseEvent(li, 'mousedown');
                                successed = true
                                state.core.actions.output_warning(`The option '${value}' was not found, and has been replaced with '${li.lastChild.wholeText.trim()}'!`)
                                break
                            }
                        }
                    }

                    if(!successed && items.length > 0) // 下拉框一个选项都没找到说明就没有这个下拉框，可能是界面设置把下拉框替换成了radio button
                    {
                        state.core.actions.output_error(`\'${store.prefix + id}\' import failed!`)
                        state.core.actions.output_error(`The option \'${value}\' was not found!`)
                    }

                    state.utils.triggerMouseEvent(input, 'blur');
                }, 100);
            }

            setTimeout(() => {
                state.utils.onContentChange(select, function (el) {
                    let selected = el.querySelector('span.single-select');
                    if (selected) {
                        store.set(id, selected.textContent);
                    } else {
                        // new gradio version...
                        let input = el.querySelector('input');
                        if (input) {
                            store.set(id, input.value);
                        }
                    }
                });
            }, 150);
        } catch (error) {
            console.error('[state]: Error:', error);
        }
    },
    handleMultipleSelect: function handleMultipleSelect(select, id, store) {
        try {
            let value = store.get(id);

            if (value) {

                value = value.split(',').reverse();

                if (value.length) {

                    let input = select.querySelector('input');

                    let selectOption = function () {

                        if (! value.length) {
                            state.utils.triggerMouseEvent(input, 'blur');
                            return;
                        }

                        let option = value.pop();
                        state.utils.triggerMouseEvent(input, 'focus');

                        setTimeout(() => {
                            let successed = false
                            let items = Array.from(select.querySelectorAll('ul li'));
                            items.forEach(li => {
                                if (li.lastChild.wholeText.trim() === option) {
                                    state.utils.triggerMouseEvent(li, 'mousedown');
                                    successed = true
                                    return false;
                                }
                            });
                            if(!successed){
                                state.core.actions.output_error(`\'${store.prefix + id}\' import failed!`)
                                state.core.actions.output_error(`The option \'${value}\' was not found!`)
                            }
                            setTimeout(selectOption, 100);
                        }, 100);
                    }
                    selectOption();
                }
            }
            //console.log(`------ onContentChange select = ${select}  250 -----`)
            state.utils.onContentChange(select, function (el) {
                const selected = Array.from(el.querySelectorAll('.token > span')).map(item => item.textContent);
                store.set(id, selected);
            });
        } catch (error) {
            console.error('[state]: Error:', error);
        }
    },
    txtToId: function txtToId(txt) {
        return txt.split(' ').join('-').toLowerCase();
    },
    callXTimes: function callXTimes(func, times) {
        let called = 0;
        return function() {
            if (called < times) {
                called++;
                return func.apply(this);
            }
        }
    },
    saveFile: function saveJSON(fileName ,data) {
        const json = JSON.stringify(data, null, 4);
        const blob = new Blob([json], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        console.log(url)
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName + '.lightflow';
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
    },
    debounce: function debounce(func, delay) {
        let lastCallTime = 0;
        return function() {
            const currentCallTime = new Date().getTime();
            if (currentCallTime - lastCallTime > delay) {
                lastCallTime = currentCallTime;
                func.apply(this, arguments);
            }
        }
    },
    onNextUiUpdates: function (func) {
        // brute force this to to ensure that the method is called after next few updates
        onUiUpdate(this.callXTimes(function () { setTimeout(func, 5); }, 150));
    }
};

state.utils.html = {
    setStyle: function setStyle(elements, style) {
        if (elements instanceof NodeList) {
            elements = Array.from(elements);
        } else if (elements instanceof Node){
            elements = [elements];
        } else {
            return;
        }
        elements.forEach(element => {
            for (let key in style) {
                if (style.hasOwnProperty(key)) {
                    element.style[key] = style[key];
                }
            }
        });
    },
    create: function create(type, props, style) {
        const element = document.createElement(type);
        if (props) {
            for (let key in props) {
                if (props.hasOwnProperty(key)) {
                    //console.log(`=================== has own property ${key} ${props[key]}`)
                    element[key] = props[key];
                }
            }
        }
        if (style) {
            this.setStyle(element, style);
        }
        return element;
    },
    createButton: function createButton(text, onclick) {
        const btn = document.createElement('button');
        btn.innerHTML = text;
        btn.onclick = onclick || function () {};
        btn.className = 'gr-button gr-button-lg gr-button-primary';
        return btn;
    }
};
