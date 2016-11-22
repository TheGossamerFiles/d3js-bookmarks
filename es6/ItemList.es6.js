/* jshint esnext: true */

class ItemList {
  constructor() {
    this.state = new StateManager(this.afterStateChange.bind(this));
    this.state.setInitial({items: []});
  }

  afterStateChange(k, v, oldV) {
    if(k === 'items') {
      this.updateView();
    }
  }

  setItems(_) { this.state.set({items: _}); }

  // #####################
  // # Render
  // #####################
  createElement() {
    if(!this.mountNode) {
      let node = document.createElement('item-list');
      node.addEventListener('click', (e) => {
        var type = e.target.dataset.src;
        if(type) {
          var idx = e.target.dataset.idx;
          var src = this.state.get().items[idx].src;
          if(type === 'block')  { /* src is good to go */}
          if(type === 'gist')   { src = src.replace("bl.ocks.org", "gist.github.com");}
          if(type === 'inlet')  { src = src.replace(/http:\/\/bl.ocks.org\/([^\/]+)\/(\w+)$/, "http://tributary.io/inlet/$2?user=$1"); }
          window.open(src, '_blank');
        }
      });
      this.mountNode = node;
    }
    this.updateView();
    return this.mountNode;
  }

  updateView() {
    let node = this.mountNode;
  var itemNode = (d) => { return d && d.length ? `<item>${d}</item>` : ''; };

    const {items} = this.state.get();
    var nodes  = items.map((d, i) => {
      var tags   = d.tags.map(itemNode).join(' ');
      var terms  = d.terms.map(itemNode).join(' ');
      var others = d.others.map(itemNode).join(' ');
      var thumbPath = d.thumb;
      var   blockLinks =  `<div>
  <span data-src="gist" data-idx="${i}">gist</span>
  (<span data-src="block" data-idx="${i}">block</span>,
  <span data-src="inlet" data-idx="${i}">inlet</span>)
</div>`;
      return `<item>
  <div class="asset-item">
    <div class="preview">
      <div class="thumb"><img data-path="${thumbPath}" src="${thumbPath}" alt="svg"></div>
      <div class="links">${blockLinks}</div>
    </div>
    <div class="desc">
      <div class="tagged tags">${tags}</div>
      <div class="tagged terms">${terms}</div>
      <div class="tagged others">${others}</div>
    </div>
  </div>
</item>`
      ;
    });
    node.innerHTML = nodes.join('\n');
    return node;
  }

}
