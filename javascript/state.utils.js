window.state = window.state || {};
state = window.state;
let selectingQueue = 0; // 默认都延时一下再开始触发

state.utils = {

  testFunction: function testFunction() {
    //console.log(state.extensions)
    // const button = gradioApp().getElementById("lightdiffusionflow_set_elements");
    // button.click();    
  },

  target_is_newer_version: function(cur_version, target_version){

    let cur = cur_version.replace("v","")
    cur = cur.split(".")

    let target = target_version.replace("v","")
    target = target.split(".")
    let version_len = Math.min(cur.length, target.length)

    // 逐个版本号比较  v1.2.3 和 v1.2比较时，只比较前面两个数字
    for (let i=0; i < version_len; i++){
      if(Number(cur[i]) > Number(target[i])){
        return false
      }
      else if(Number(cur[i]) < Number(target[i])){
        return true
      }
    }

    // 前面的版本号一样，再看谁的版本号更长
    if(cur.length >= target.length){
      return false
    }

    return true
  },

  searchCheckPointByHash: async function searchCheckPointByHash(hash){
    let downloadUrl = undefined
    hash_str = hash.replace("[","").replace("]","").replace(/^\s+|\s+$/g,"")
    await fetch("https://civitai.com/api/v1/model-versions/by-hash/"+hash_str)
    .then(response => response.json())
    .then(data => {
      //try{
        //console.log(data["files"])
        for (file of data["files"]){
          for (key of Object.keys(file["hashes"])){
            if(file["hashes"][key].toLowerCase() === hash_str.toLowerCase())
            {
              downloadUrl = file["downloadUrl"]
              console.log(downloadUrl)
              break
            }
          }
        }
        if(downloadUrl == undefined){downloadUrl = data["files"][0]["downloadUrl"]}
      //} catch (error) {}
    }).catch(function(e) {
      console.log("search model error!");
    });

    return downloadUrl
  },

  getTranslation: function getTranslation(key){
    new_key = key
    try{
      if(window.localization[new_key.replace(/^\s+|\s+$/g,"")] != undefined){
        new_key = window.localization[new_key]
      }
    } catch (error) {
      console.warn('getTranslation error:', error);
    }
    return new_key
  },

  reverseTranslation: function reverseTranslation(key){
    new_key = []
    try{
      //key=key.replace(/^\s+|\s+$/g,"");
      for (localize_key of Object.keys(window.localization)) {
        if(key.replace(/^\s+|\s+$/g,"") === window.localization[localize_key].replace(/^\s+|\s+$/g,"")){ 
          tmp_key = localize_key
          new_key.push(tmp_key)
          //break
        }
      }
    } catch (error) {
      console.warn('reverseTranslation error:', error);
    }

    if(new_key.length == 0){new_key.push(key)}
    //console.log(`---------reverseTranslation---------${key}---------`)
    //console.log(new_key)
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

    let elem = undefined
    elem = gradioApp().getElementById('txt2img_controlnet')
    elem = elem.querySelector("#controlnet")

    try{
      if(elem.className.split(' ').pop() != "open"){
        state.utils.triggerMouseEvent(elem, 'click')
      }
      for(e of elem.children){
        if(e.className.split(' ').pop() != "open"){
          state.utils.triggerMouseEvent(e, 'click')
        }
      }
    } catch(error){console.log(error)}

    try{
      gradioApp().getElementById('txt2img_controlnet_tabs').querySelectorAll('button')[Number(unit)].click()
    } catch (error) {
      console.warn('[switch_to_txt2img_ControlNet]: Error:', error);
    }
  },
  switch_to_img2img_ControlNet: function switch_to_img2img_ControlNet(unit) {
    
    switch_to_img2img()
    
    let elem = undefined //gradioApp().getElementById('txt2img_controlnet').children[0].children[1]
    elem = gradioApp().getElementById('img2img_controlnet')
    elem = elem.querySelector("#controlnet")
    
    try{
      if(elem.className.split(' ').pop() != "open"){
        state.utils.triggerMouseEvent(elem, 'click')
      }
      for(e of elem.children){
        if(e.className.split(' ').pop() != "open"){
          state.utils.triggerMouseEvent(e, 'click')
        }
      }
    } catch(error){console.log(error)}

    try{
      gradioApp().getElementById('img2img_controlnet_tabs').querySelectorAll('button')[Number(unit)].click()
    } catch (error) {
      console.warn('[switch_to_img2img_ControlNet]: Error:', error);
    }
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
        }
        else if(element.value == "Scribble/Sketch" && value == "Scribble"){
          element.checked = true;
          this.triggerEvent(element, event);
        } 
        else {
          element.checked = false;
        }
        break;
      default:
        element.value = value;
        this.triggerEvent(element, event);
    }
  },
  onContentChange: function onContentChange(targetNode, func) {
    if(targetNode) {
      const observer = new MutationObserver((mutationsList, observer) => {
        for (const mutation of mutationsList) {
          if (mutation.type === 'childList' || 
            (mutation.type === 'attributes' && mutation.attributeName == 'src') // 图片被更改
          ) {
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
    }
  },

  onAccordionChange: function onAccordionChange(targetNode, func) {
    if(targetNode) {
      const observer = new MutationObserver((mutationsList, observer) => {
        for (const mutation of mutationsList) {
          if (mutation.type === 'attributes' ) {
            func(targetNode);
          }
        }
      });
      observer.observe(targetNode, {
        attributes: true,
      });
    }
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
        console.log(`image changed ${id}`)
        fetch(`/lightdiffusionflow/local/imgs_callback`, data)
      });
    }, 150);
  },

  clearImage: function clearImage(select) {
    try {
      if(select){
        
        let buttons = select.querySelectorAll('button');
        buttons.forEach(button => {
          if(button.getAttribute("aria-label") == "Clear"){
            button.click();
            //state.utils.triggerMouseEvent(button, 'mousedown');
          }
        });
        
      }
    } catch (error) {
      console.warn('[state]: Error:', error);
    }
  },
  // handleSelect: function handleSelect(select, id, store) {
  //   try {
  //     let value = store.get(id);
  //     if (value) {
        
  //       let input = select.querySelector('input');
  //       state.utils.triggerMouseEvent(input, 'focus');
        
  //       setTimeout(() => {
  //         let items = Array.from(select.querySelectorAll('ul li'));
  //         for (li of items){
  //           if (li.lastChild.wholeText.trim() === value) {
  //             state.utils.triggerMouseEvent(li, 'mousedown');
  //             //return false;
  //             break
  //           }
  //         }
  //         state.utils.triggerMouseEvent(input, 'blur');
  //       }, 100);
  //     }

  //     setTimeout(() => {
  //       state.utils.onContentChange(select, function (el) {
  //         let selected = el.querySelector('span.single-select');
  //         if (selected) {
  //           store.set(id, selected.textContent);
  //         } else {
  //           // new gradio version...
  //           let input = select.querySelector('input');
  //           if (input) {
  //             store.set(id, input.value);
  //           }
  //         }
  //       });
  //     }, 150);
  //   } catch (error) {
  //     console.warn('[state]: Error:', error);
  //   }
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
  handleAccordion: function handleAccordion(accordion, id, store){
    try{
      let value = store.get(id);
      let child = accordion.querySelector('div.cursor-pointer, .label-wrap');
      if (value) {
        //for(child of children){
        //let span = child.querySelector('.transition, .icon');
        //if(span.style.transform !== 'rotate(90deg)'){
        if(child.className.split(' ').pop() != "open"){
          state.utils.triggerMouseEvent(child, 'click')
        }
        //}
      }

      setTimeout(() => {
        state.utils.onAccordionChange(child, function (el) {
          store.set(id, el.className.split(' ').pop() == "open");
          //console.log(`accordion on change ${id}`)
          //let span = el.querySelector('.transition, .icon');
          //store.set(id, span.style.transform !== 'rotate(90deg)');
        });
      }, 150);

    } catch (error) {
      console.warn(`accordion:${accordion}, id:${id}`)
      console.warn('[state]: Error:', error);
    }

  },
  handleSelect: function handleSelect(select, id, store, force=false) {
    try {

      let value = store.get(id);
      if ( value ) { //&& value != 'None'

        selectingQueue += 1;
        setTimeout(() => {

          let input = select.querySelector('input');
          state.utils.triggerMouseEvent(input, 'focus');
          setTimeout(() => {
            let items = Array.from(select.querySelectorAll('ul li'));
            let localized_value = this.getTranslation(value)
            let successed = false
            for (li of items){
              // li.lastChild.wholeText.trim() === value
              if (localized_value.replace(/^\s+|\s+$/g,"") === li.lastChild.wholeText.trim().replace(/^\s+|\s+$/g,"")) {
                state.utils.triggerMouseEvent(li, 'mousedown');
                successed = true
                break
              }
            }

            let hash_res = localized_value.match(/\[[0-9A-Fa-f]{8,10}\]/)
            if(!successed){ // && hash_pos != -1 找不到对应选项 并且选项里有10位哈希值
              for (li of items){
                
                // 去掉Hash比较
                let text = li.lastChild.wholeText.trim()
                let localized_value_no_hash = localized_value.replace(/\[[0-9A-Fa-f]{8,10}\]/,"").replace(/^\s+|\s+$/g,"")
                let text_no_hash = text.replace(/\[[0-9A-Fa-f]{8,10}\]/, "").replace(/^\s+|\s+$/g,"")
                
                if (localized_value_no_hash === text_no_hash) {
                  successed = true
                }
                
                // 只比较Hash
                if(!successed && hash_res != null){
                  let hash_str = hash_res[0].replace(/^\s+|\s+$/g,"")
                  let text_hash_res = text.match(/\[[0-9A-Fa-f]{8,10}\]/)
                  if(text_hash_res != null){
                    let text_hash = text_hash_res[0].replace(/^\s+|\s+$/g,"")
                    if (hash_str === text_hash) {
                      successed = true
                    }
                  }
                }

                if(successed){
                  state.utils.triggerMouseEvent(li, 'mousedown');
                  // state.core.actions.output_log(
                  //   `Note: \'<b style="color:Orange;">${value}</b>\' not found. An approximate match \'<b style="color:Orange;">${li.lastChild.wholeText.trim()}</b>\' has been automatically selected as replacement.`
                  // )
                  state.core.actions.preset_output_log("alt_option", value, li.lastChild.wholeText.trim())
                  break
                }
              }
            }

            if(!successed && items.length > 0) // 下拉框一个选项都没找到说明就没有这个下拉框，可能是界面设置把下拉框替换成了radio button
            {
              let option_name = store.prefix + id
              if(option_name === "state-setting_sd_model_checkpoint"){
                // 大模型找不到就只用warning提示，因为不影响运行
                // state.core.actions.output_log(`Note: \'<b style="color:Orange;">${value}</b>\' not found.`)
                state.core.actions.preset_output_log("no_option", "stable diffusion checkpoint", value)
              }
              else{
                //state.core.actions.output_log(`Error: \'<b style="color:Red;">${option_name}</b>\' import failed! The option \'<b style="color:Red;">${value}</b>\' was not found!`)
                state.core.actions.preset_output_log("no_option", option_name, value)
              }
              if(hash_res != null){
                let model_name = value
                let hash_str = hash_res[0]
                state.utils.searchCheckPointByHash(hash_str).then( downloadUrl => {
                  if(downloadUrl != undefined){
                    // let warning_str = encodeURIComponent(`Click to download \
                    // <a style ='text-decoration:underline;color:cornflowerblue;', href='${downloadUrl}'> ${model_name} </a>`)
                    // state.core.actions.output_warning(warning_str)
                    state.core.actions.preset_output_log("download_url", model_name, downloadUrl)
                  }
                });
              }
            }

            state.utils.triggerMouseEvent(input, 'blur');
            selectingQueue -= 1;
            //console.log(`selectingQueue = ${selectingQueue}`)
          }, 100);

        }, selectingQueue * 200)
      }

      setTimeout(() => {
        state.utils.onContentChange(select, function (el) {
          let selected = el.querySelector('span.single-select');
          if(force){
            let localized_id = state.utils.getTranslation(id)
            let id_translations = state.utils.reverseTranslation(localized_id)
            //宁可错存一千，也不漏存一个
            for (trans_id of id_translations){
              if (selected) {
                store.set(trans_id, selected.textContent);
              } else {
                // new gradio version...
                let input = el.querySelector('input');
                if (input) {
                  store.set(trans_id, input.value);
                }
              }
            }
          }
          else{
            if (selected) {
              store.set(id, selected.textContent);
            } else {
              // new gradio version...
              let input = el.querySelector('input');
              if (input) {
                store.set(id, input.value);
              }
            }
          }
        });
      }, 150);
    } catch (error) {
      console.warn('[state]: Error:', error);
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
                state.core.actions.preset_output_log("no_option", store.prefix + id, value)
                //state.core.actions.output_log(`Error: \'<b style="color:Red;">${store.prefix + id}</b>\' import failed! The option \'<b style="color:Red;">${value}</b>\' was not found!`)
              }
              setTimeout(selectOption, 100);
            }, 100);
          }
          selectOption();
        }
      }
      state.utils.onContentChange(select, function (el) {
        const selected = Array.from(el.querySelectorAll('.token > span')).map(item => item.textContent);
        store.set(id, selected);
      });
    } catch (error) {
      console.warn('[state]: Error:', error);
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
    link.download = fileName;

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
