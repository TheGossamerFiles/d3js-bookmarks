/* jshint esnext: true */

class MultiSelect {

  constructor({placeholder, onChange, selectedItems}) {
    this.props = {placeholder, onChange};

    this.state = new StateManager(this.afterStateChange.bind(this));
    if(!Array.isArray(selectedItems)) { selectedItems = []; }
    this.state.setInitial({fragment: '', selectedItems, active: false});

    this.debounced = {
      updateFilter: new Debouncer(50, this.updateFilter.bind(this))
    };
    this.bound = [
      'onActivated',
      'onDisactivated',
      'onFragmentChange',
      'onRemovedChange',
      'onItemAdded'
    ].reduce((acc, k) => { acc[k] = this[k].bind(this); return acc; }, {});
    this.refs = {
      selection:  new RemovableItems({onChange: this.bound.onRemovedChange, items: this.state.get().selectedItems}),
      selectable: new SelectableItems({onChange: this.bound.onItemAdded})
    };

  }

  // #####################
  // # Pseudo accessors
  // #####################
  setSelectableItems(_) {
    const {selectable} = this.refs;
    selectable.setItems(_);
  }

  // #####################
  // # Dealing with state change
  // #####################
  afterStateChange(k, v, mutated) {
    if(['fragment','selectedItems'].includes(k)) {
      this.debounced.updateFilter.trigger();
    }
    if(['selectedItems'].includes(k)) {
      let {onChange}  = this.props;
      onChange(v);
      this.updateView();
    }
    if(['active', 'fragment'].includes(k)) {
      this.updateView();
    }
  }

  // #####################
  // # Flow
  // #####################
  onDisactivated()      { this.state.set({active: false}); }
  onActivated()         { this.state.set({active: true}); }
  onFragmentChange(str) { this.state.set({fragment: str}); }
  onItemAdded(item) {
    this.state.set({fragment: ''});
    this.refs.selection.addItem(item);
  }
  onRemovedChange(items) {
    this.state.set({selectedItems: items});
  }

  // #####################
  // # Main
  // #####################

  updateFilter() {
    let {selectable} = this.refs;
    let {fragment, selectedItems} = this.state.get();
    selectable.setFilterFn((d) => {
      var included = false;
      var noFragment = (typeof fragment !== "string") || (fragment.length === 0);
      if(noFragment || (d.indexOf(fragment) !== -1)) { included = true; }
      var itemsIsArray = (Array.isArray(selectedItems)) ? true : false;
      if(itemsIsArray && selectedItems.includes(d)) { included = false; }
      return included;
    });
  }

  // #####################
  // # Render
  // #####################
  createElement() {
    if(!this.mountNode) {
      const {onDisactivated, onActivated, onFragmentChange} = this.bound;

      let {placeholder} = this.props;
      if(typeof placeholder !== 'string') { placeholder = ''; }

      let node = document.createElement('multi-select');
      node.innerHTML = `
<div class="selection"></div>
<div class="input"><input placeholder="${placeholder}" data-fragment></input></div>
<div class="selectable"></div>`;

      node.querySelector('.selection').appendChild(this.refs.selection.createElement());
      node.querySelector('.selectable').appendChild(this.refs.selectable.createElement());

      node.addEventListener('mouseleave', (evt) => { onDisactivated(); }, false);
      var isFragment = (target) => { return target.dataset.fragment !== undefined; };
      node.addEventListener('mouseover', (evt) => {
        if(isFragment(evt.target)) { onActivated(); }
      });
      node.addEventListener('keyup', (evt) => {
        if(isFragment(evt.target)) { onFragmentChange(evt.target.value); }
      });
      this.mountNode = node;
    }
    this.updateView();
    return this.mountNode;
  }

  updateView() {

    let node = this.mountNode;
    const {active, fragment} = this.state.get();
    const changed = this.state.changes();

    // selection element
    // input element
    let inputNode = node.querySelector('.input input');
    if(changed.includes(fragment)) {
      inputNode.value = fragment;
    }

    // input element
    let selectableNode = node.querySelector('.selectable');
    if(changed.includes('active')) {
      setClassName(selectableNode, 'inactive', !active);
    }

    return node;
  }

}

// #####################
// # Utilities
// #####################

function replaceChild(node, child) {
  node.innerHTML = '';
  node.appendChild(child);
}

function setClassName(node, name, isAdded) {
  let classList = node.classList;
  if (!isAdded && classList.contains(name)) {
    classList.remove(name);
  } else if(isAdded && !classList.contains(name)) {
    classList.add(name);
  }
}
