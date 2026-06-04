const _state = {
  medecin:     null,
  page:        'dashboard',
  currentUser: null,
  userRole:    null,
};

const _listeners = {};

export function getState() {
  return { ..._state };
}

export function setState(updates) {
  Object.assign(_state, updates);
  Object.keys(updates).forEach(key => {
    (_listeners[key] || []).forEach(fn => fn(_state[key]));
  });
}

export function subscribe(key, fn) {
  if (!_listeners[key]) _listeners[key] = [];
  _listeners[key].push(fn);
  return () => {
    _listeners[key] = _listeners[key].filter(f => f !== fn);
  };
}
