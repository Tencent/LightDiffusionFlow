window.state = window.state || {};
window.state.extensions = window.state.extensions || {};
state = window.state;

function general_ext(tab_name, extension_name, root_container) {

    let container = root_container;
    let store = null;
    let cnTabs = [];
    let cur_tab_name = tab_name;
    let ext_name = extension_name
    let LS_PREFIX = 'ext-'+ ext_name.replace(" ","-").toLowerCase() + "-"

    function handleToggle() {
        let value = store.get('toggled');
        let toggleBtn = container.querySelector('div.cursor-pointer, .label-wrap');

        if (value && value === 'true') {
            state.utils.triggerEvent(toggleBtn, 'click');
            load();
        }
        toggleBtn.addEventListener('click', function () {
            let span = this.querySelector('.transition, .icon');
            store.set('toggled', span.style.transform !== 'rotate(90deg)');
            load();
        });
    }

    function bindTabEvents() {
        const tabs = container.querySelectorAll('.tabs > div > button');
        tabs.forEach(tab => { // dirty hack here
            tab.removeEventListener('click', onTabClick);
            tab.addEventListener('click', onTabClick);
        });
        return tabs;
    }

    function handleTabs() {
        let tabs = bindTabEvents();
        let value = store.get('tab');
        if (value) {
            for (var i = 0; i < tabs.length; i++) {
                let translations = state.utils.reverseTranslation(tabs[i].textContent)
                if (value in translations) {
                //if (tabs[i].textContent === value) {
                    state.utils.triggerEvent(tabs[i], 'click');
                    break;
                }
            }
        }
    }

    function onTabClick() {
        store.set('tab', state.utils.reverseTranslation(this.textContent)[0]);
        bindTabEvents();
    }

    function handleCheckboxes() {
        cnTabs.forEach(({ container, store }) => {
            let checkboxes = container.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(function (checkbox) {
                let label = checkbox.nextElementSibling;
                let translations = state.utils.reverseTranslation(label.textContent)
                for (var text of translations){
                    var id = state.utils.txtToId(text);
                    var value = store.get(id);
                    if (value) {break}
                }
                if (value) {
                    state.utils.setValue(checkbox, value, 'change');
                }
                checkbox.addEventListener('change', function () {
                    store.set(id, this.checked);
                });
            });
        });
    }

    function handleSelects() {
        cnTabs.forEach(({ container, store }) => {
            container.querySelectorAll('.gradio-dropdown').forEach(select => {
                let translations = state.utils.reverseTranslation(select.querySelector('label').firstChild.textContent)
                for (var text of translations){
                    var id = state.utils.txtToId(text);
                    var value = store.get(id);
                    if (value) {break}
                }
                state.utils.handleSelect(select, id, store);
                if (id === 'preprocessor' && value && value.toLowerCase() !== 'none') {
                    state.utils.onNextUiUpdates(handleSliders); // update new sliders if needed
                }
            });
        });
    }

    function handleSliders() {
        cnTabs.forEach(({ container, store }) => {
            let sliders = container.querySelectorAll('input[type="range"]');
            sliders.forEach(function (slider) {
                let label = slider.previousElementSibling.querySelector('label span');
                let translations = state.utils.reverseTranslation(label.textContent)
                for (var text of translations){
                    var id = state.utils.txtToId(text);
                    var value = store.get(id);
                    if (value) {break}
                }
                if (value) {
                    state.utils.setValue(slider, value, 'change');
                }
                slider.addEventListener('change', function () {
                    store.set(id, state.utils.reverseTranslation(this.value)[0]);
                });
            });
        });
    }

    function handleRadioButtons() {
        cnTabs.forEach(({ container, store }) => {
            let fieldsets = container.querySelectorAll('fieldset');
            fieldsets.forEach(function (fieldset) {
                let label = fieldset.firstChild.nextElementSibling;
                let radios = fieldset.querySelectorAll('input[type="radio"]');
                let translations = state.utils.reverseTranslation(label.textContent)
                for (var text of translations){
                    var id = state.utils.txtToId(text);
                    var value = store.get(id);
                    if (value) {break}
                }
                if (value) {
                    radios.forEach(function (radio) {
                        state.utils.setValue(radio, value, 'change');
                    });
                }
                radios.forEach(function (radio) {
                    radio.addEventListener('change', function () {
                        store.set(id, state.utils.reverseTranslation(this.value)[0]);
                    });
                });
            });
        });
    }

    function load() {
        setTimeout(function () {
            handleTabs();
            handleCheckboxes();
            handleSelects();
            handleSliders();
            handleRadioButtons();
        }, 500);
    }

    function init() {

        store = new state.Store(LS_PREFIX + cur_tab_name);

        if (! container) {
            return;
        }

        let tabs = container.querySelectorAll('.tabitem');
        console.log(tabs)
        
        if (tabs.length) {
            cnTabs = [];
            tabs.forEach((tabContainer, i) => {
                cnTabs.push({
                    container: tabContainer,
                    store: new state.Store(LS_PREFIX + cur_tab_name + "_" + i)
                });
            });
        } else {
            cnTabs = [{
                container: container,
                store: new state.Store(LS_PREFIX + cur_tab_name + "_0")
            }];
        }

        handleToggle();
        load();
    }
    return { init,LS_PREFIX };
}


function general_ext_main(tab){

    let cur_tab_name = tab
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

    function init() {
        let container = gradioApp().getElementById(cur_tab_name+'_script_container'); // main container
        for (child of container.children){
            let root_container = child
            res = walks_element(child, 0)
            let min_gen = 99
            let title = undefined
            for(pair of res){
                if(pair[1] < min_gen){
                    min_gen = pair[1]
                    title = pair[0]
                }
            }
            
            if(title == undefined){continue}

            let translations = state.utils.reverseTranslation(title)
            title = translations[0] // 标题翻译一般只会有一个？
            if(title == 'Script'){break}
            console.log(title)
            
            reg = /(.+) v[0-9\.]+/
            if(reg.test(title)){title = RegExp.$1}

            if(title == "ControlNet"){title = "Control Net"} // 兼容旧命名
            
            let ext_name = title.replace(" ","-").toLowerCase()
            console.log(ext_name)
            general_ext(cur_tab_name, ext_name, root_container).init();

        }
        
    }
    return {init}
}

const TABS = ['txt2img', 'img2img'];

for (tab of TABS){
    state.extensions[`${tab}-ext-general`] = general_ext_main(tab);
}
