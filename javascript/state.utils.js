window.state = window.state || {};
state = window.state;

state.utils = {
    testFunction: function testFunction() {
        console.log("test function")
        //tabs = gradioApp().querySelector('#tabs').querySelectorAll('button')
        //console.log(tabs)
        // let elem = undefined //gradioApp().getElementById('txt2img_controlnet').children[0].children[1]
        // for (child of gradioApp().getElementById('txt2img_controlnet').children){
        //     if(child.id == "controlnet"){
        //         elem = child.children[1]
        //     }
        // }
        // if(elem.className.split(' ').pop() != "open"){
        //     state.utils.triggerMouseEvent(elem, 'click')
        // }
        // gradioApp().getElementById('txt2img_controlnet_tabs').querySelectorAll('button')[0].click()
        let select = gradioApp().getElementById('setting_sd_model_checkpoint')
        
        let input = select.querySelector('input');
        state.utils.triggerMouseEvent(input, 'focus');

        setTimeout(() => {
            let items = Array.from(select.querySelectorAll('ul li'));
            console.log(`-----handleSelect--------${items}--------------`)
            items.forEach(li => {
                console.log(`==========handleSelect======${li.lastChild.wholeText.trim()}===========`)
                // if (li.lastChild.wholeText.trim() === value) {
                //     state.utils.triggerMouseEvent(li, 'mousedown');
                //     return false;
                // }
            });
            //state.utils.triggerMouseEvent(input, 'blur');
        }, 100);

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
    switch_to_img2img_ControlNet: function switch_to_txt2img_ControlNet(unit) {
        
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
            console.warn('[switch_to_txt2img_ControlNet]: Error:', error);
        }
    },

    importState: function () {
        let store = new state.Store();
        const fileInput = gradioApp().getElementById('state-import-file-inline' || 'state-import-file');
        state.utils.triggerMouseEvent(fileInput);
        console.log(`==================state.utils importState click = ${fileInput.files[0]}`)
        
        setTimeout(() => {
            if (! fileInput.files || ! fileInput.files[0]) {
                alert('Please select a JSON file!');
                return;
            }
            const file = fileInput.files[0];
            const reader = new FileReader();
            reader.onload = function (event) {
                store.load(JSON.parse(event.target.result));
                actions.applyState()
                //window.location.reload();
            };
            reader.readAsText(file);
        }, 150);
    },

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
    exportState: function () {
        let store = new state.Store();
        //state.utils.saveFile('sd-webui-state', store.getAll());
        
        fetch('/state/lightflowconfig?onlyimg=true')
        .then(response => response.json())
        .then(config => {
            config = JSON.parse(config)
            stored_config = store.getAll()
            //console.log(config)
            //console.log(stored_config)
            for (let key in config){
                //console.log(config[key])
                if(config[key] != ""){
                    stored_config[key] = config[key]
                }
            }
            //console.log(stored_config)
            state.utils.saveFile('sd-webui-state', stored_config);

        }).catch(error => console.error('[state]: Error getting JSON file:', error));

        //config = JSON.stringify(store.getAll(), null, 4);
        //fetch(`/state/ExportLightflow?config=${config}`)
    },

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
                if (mutation.type === 'childList') {
                    func(targetNode);
                }
            }
        });
        observer.observe(targetNode, {
            childList: true,
            characterData: true,
            subtree: true
        });
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
                    //console.log(`------ onContentChange select = ${el} --${id}---`)
                    let img = el.querySelector('img');
                    if (img) {
                        data.body = JSON.stringify({
                            "id":id,
                            "img":img.src
                        })
                        //console.log(`------ handleImage id = ${id} -----`)
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
    handleSelect: function handleSelect(select, id, store) {
        try {
            let value = store.get(id);
            if (value) {
                
                let input = select.querySelector('input');
                state.utils.triggerMouseEvent(input, 'focus');
                
                console.log(`-----handleSelect------${id}-----${select}-----------------`)
                console.log(`-----handleSelect-----------${input}---${value}--------------`)
                setTimeout(() => {
                    let items = Array.from(select.querySelectorAll('ul li'));
                    console.log(`-----handleSelect--------${items}--------------`)
                    items.forEach(li => {
                        console.log(`==========handleSelect======${li.lastChild.wholeText.trim()}===========`)
                        if (li.lastChild.wholeText.trim() === value) {
                            state.utils.triggerMouseEvent(li, 'mousedown');
                            return false;
                        }
                    });
                    state.utils.triggerMouseEvent(input, 'blur');
                }, 100);
            }

            setTimeout(() => {
                console.log(`------ onContentChange select = ${select}  196 -----`)
                state.utils.onContentChange(select, function (el) {
                    let selected = el.querySelector('span.single-select');
                    if (selected) {
                        store.set(id, selected.textContent);
                    } else {
                        // new gradio version...
                        let input = select.querySelector('input');
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
                            let items = Array.from(select.querySelectorAll('ul li'));
                            items.forEach(li => {
                                if (li.lastChild.wholeText.trim() === option) {
                                    state.utils.triggerMouseEvent(li, 'mousedown');
                                    return false;
                                }
                            });
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
