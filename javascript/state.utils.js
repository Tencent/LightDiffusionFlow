window.state = window.state || {};
state = window.state;

state.utils = {

  testFunction: function testFunction() {
    
    //console.log(state.extensions)
    let str = "chilloutmix_Ni.safetensors [7234b76e42]"
    let res = str.search(/\[[0-9A-Fa-f]{10}\]/)
    res = str.substring(res,res+12)
    console.log(res)
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
        
        fetch(`/lightspeedflow/local/imgs_callback`, data)
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
      console.error('[state]: Error:', error);
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
  //     console.error('[state]: Error:', error);
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
        if(child.className.split(' ').pop() != "open"){
          state.utils.triggerMouseEvent(child, 'click')
        }
        //}
      }

      setTimeout(() => {
        state.utils.onContentChange(child, function (el) {
          store.set(id, el.className.split(' ').pop() == "open");
        });
      }, 150);

    } catch (error) {
      console.error(`accordion:${accordion}, id:${id}`)
      console.error('[state]: Error:', error);
    }

  },
  handleSelect: function handleSelect(select, id, store, force=false) {
    try {
      let value = store.get(id);
      if (value ) { //&& value != 'None'
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

          let hash_pos = localized_value.search(/\[[0-9A-Fa-f]{10}\]/)
          if(!successed){ // && hash_pos != -1 找不到对应选项 并且选项里有10位哈希值
            for (li of items){
              
              // 去掉Hash比较
              let text = li.lastChild.wholeText.trim()
              let localized_value_no_hash = localized_value.replace(/\[[0-9A-Fa-f]{10}\]/,"").replace(/^\s+|\s+$/g,"")
              let text_no_hash = text.replace(/\[[0-9A-Fa-f]{10}\]/, "").replace(/^\s+|\s+$/g,"")
              
              if (localized_value_no_hash === text_no_hash) {
                successed = true
              }
              
              // 只比较Hash
              if(!successed){
                let hash_str = localized_value.substring(hash_pos,hash_pos+12).replace(/^\s+|\s+$/g,"")
                let text_hash_pos = text.search(/\[[0-9A-Fa-f]{10}\]/)
                let text_hash = text.substring(text_hash_pos, text_hash_pos+12).replace(/^\s+|\s+$/g,"")
                if (hash_str === text_hash) {
                  successed = true
                }
              }

              if(successed){
                state.utils.triggerMouseEvent(li, 'mousedown');
                state.core.actions.output_warning(
                  `The option '${value}' was not found, and has been replaced with '${li.lastChild.wholeText.trim()}'!`)
                break
              }
            }
          }

          if(!successed && items.length > 0) // 下拉框一个选项都没找到说明就没有这个下拉框，可能是界面设置把下拉框替换成了radio button
          {
            let option_name = store.prefix + id
            if(option_name === "state-setting_sd_model_checkpoint"){
              // 大模型找不到就只用warning提示，因为不影响运行
              state.core.actions.output_warning(`The option \'${value}\' was not found!`)
            }
            else{
              state.core.actions.output_error(`\'${option_name}\' import failed! The option \'${value}\' was not found!`)
            }
            if(hash_pos != -1){
              let hash_str = localized_value.substring(hash_pos,hash_pos+12)
              state.utils.searchCheckPointByHash(hash_str).then( downloadUrl => {
                if(downloadUrl != undefined){
                  state.core.actions.output_warning(`click to download \
                  <a style ="text-decoration:underline;color:cornflowerblue;", href="${downloadUrl}"> ${value} </a>`)
                }
              });
            }
          }

          state.utils.triggerMouseEvent(input, 'blur');
        }, 100);
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
    link.download = fileName + '.lightspeedflow';
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
