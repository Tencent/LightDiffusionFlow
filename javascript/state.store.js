window.state = window.state || {};
state = window.state;

state.Store = function Store (prefix) {
  this.prefix = state.constants.LS_PREFIX + (prefix ? prefix + '-' : '');
}

state.Store.prototype.setWithNoPrefix = function (key, value) {
    localStorage.setItem(key, value);
};

state.Store.prototype.set = function (key, value) {
  if (key.startsWith(this.prefix)) {
    localStorage.setItem(key, value);
  } else {
    localStorage.setItem(this.prefix + key, value);
  }
};

state.Store.prototype.get = function (key) {
  return localStorage.getItem(this.prefix + key);
};

state.Store.prototype.remove = function (key) {
  localStorage.removeItem(this.prefix + key);
};

state.Store.prototype.clear = function () {
  localStorage.clear();
};

state.Store.prototype.clearAll = function () {
  let keys = Object.keys(localStorage);
  for (let i = 0; i < keys.length; i++) {
    if (keys[i].startsWith(state.constants.LS_PREFIX)) {
      localStorage.removeItem(keys[i]);
    }
  }
};

state.Store.prototype.getAll = function () {
  let result = {};
  let keys = Object.keys(localStorage);
  for (let i = 0; i < keys.length; i++) {
    if (keys[i].startsWith(state.constants.LS_PREFIX)) {
      result[keys[i]] = localStorage[keys[i]];
    }
  }
  return result;
};

state.Store.prototype.load = function (json) {
  this.clearAll();
  let keys = Object.keys(json);
  for (let i = 0; i < keys.length; i++) {
    if (keys[i].startsWith(state.constants.LS_PREFIX)) {
      this.set(keys[i], json[keys[i]]);
    }
  }
};
