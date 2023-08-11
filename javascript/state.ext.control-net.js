window.state = window.state || {};
window.state.extensions = window.state.extensions || {};
state = window.state;

function constrol_net(tab_name) {

    let container = null;
    let store = null;
    let cnTabs = [];
    let cur_tab_name = tab_name;
    let localization_dict = {}
    let LS_PREFIX = 'ext-control-net-'

    function set_localization(localization){
        localization_dict = localization
    }

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
                if (value in state.utils.internationalize(localization_dict, tabs[i].textContent)) {
                //if (tabs[i].textContent === value) {
                    state.utils.triggerEvent(tabs[i], 'click');
                    break;
                }
            }
        }
    }

    function onTabClick() {
        store.set('tab', state.utils.internationalize(localization_dict, this.textContent)[0]);
        bindTabEvents();
    }

    function handleCheckboxes() {
        cnTabs.forEach(({ container, store }) => {
            let checkboxes = container.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(function (checkbox) {
                let label = checkbox.nextElementSibling;
                let id = state.utils.txtToId(state.utils.internationalize(localization_dict, label.textContent)[0]);
                let value = store.get(id);
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
                let id = state.utils.txtToId(state.utils.internationalize(localization_dict, select.querySelector('label').firstChild.textContent)[0]);
                let value = store.get(id);
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
                let id = state.utils.txtToId(state.utils.internationalize(localization_dict, label.textContent)[0]);
                let value = store.get(id);
                if (value) {
                    state.utils.setValue(slider, value, 'change');
                }
                slider.addEventListener('change', function () {
                    store.set(id, state.utils.internationalize(localization_dict, this.value)[0]);
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
                let id = state.utils.txtToId(state.utils.internationalize(localization_dict, label.textContent)[0]);
                let value = store.get(id);
                if (value) {
                    radios.forEach(function (radio) {
                        state.utils.setValue(radio, value, 'change');
                    });
                }
                radios.forEach(function (radio) {
                    radio.addEventListener('change', function () {
                        store.set(id, state.utils.internationalize(localization_dict, this.value)[0]);
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

        container = gradioApp().getElementById(cur_tab_name+'_controlnet');

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
    return { init,set_localization,LS_PREFIX };
}

state.extensions['img2img-ext-control-net'] = constrol_net("img2img");
state.extensions['txt2img-ext-control-net'] = constrol_net("txt2img");
