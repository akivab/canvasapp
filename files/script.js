/**
 * @fileoverview Description of this file.
 */
var $ = function(s) {
  return document.getElementById(s);
};

var isTouch = function() {
  return !!('ontouchstart' in window);
};

var Drawing = function(){
  this.pictureName = window.location.hash;
  if (!this.pictureName) {
    var S4 = function(){
      return Math.floor(Math.random() * 0x10000).toString(16);
    };
    var id = S4()+S4()+S4();
    window.location.hash = "#" + id;
    this.pictureName = "#" + id;
  }
};

Drawing.colorMap = {
  red: "255,0,0",
  green: "0,255,0",
  yellow: "255,255,0",
  purple: "128,0,128",
  orange: "255,165,0",
  blue: "0,0,255",
  black: "0,0,0",
  white: "255,255,255"
};

Drawing.setChooserVisibility = function(bool) {
  $('chooser').style.visibility = bool ? 'visible' : 'hidden';
  $('canvas').style.visibility = bool ? 'hidden' : 'visible';
};

Drawing.listenChange = function(obj, evt) {
  obj.addEventListener('change', evt);
};

Drawing.listen = function(obj, evt) {
  var evtType = isTouch() ? 'touchstart' : 'mousedown';
  obj.addEventListener(evtType, evt);
  document.addEventListener(evtType, function(e){ e.preventDefault(); });
};

Drawing.listenMove = function(obj, evt) {
  var evtType = isTouch() ? 'touchmove' : 'mousemove';
  obj.addEventListener(evtType, evt);
  document.addEventListener(evtType, function(e){ e.preventDefault(); });
};

Drawing.listenEnd = function(obj, evt) {
  var evtType = isTouch() ? 'touchend' : 'mouseup';
  obj.addEventListener(evtType, evt);
  document.addEventListener(evtType, function(e){ e.preventDefault(); });
};

Drawing.getColorFromId = function(colorId) {
  return Drawing.colorMap[colorId];
};

Drawing.getAlphaFromId = function(alphaId) {
  var alpha = parseInt(alphaId.match(/alpha(\d+)/)[1], 10);
  return alpha / 50.0;
};

Drawing.getSizeFromId = function(sizeId) {
  var size = parseInt(sizeId.match(/size(\d+)/)[1], 10);
  return 5 * size;
};

Drawing.prototype.isPainting = false;
Drawing.prototype.alpha = 0.1;
Drawing.prototype.color = "256,0,0";
Drawing.prototype.size = 10;


Drawing.prototype.setup = function() {
  this.setupCanvas();
  this.setupPicker();
  this.loadLatest();
  $('title').innerHTML = this.pictureName;
  var tmp = this;
  Drawing.listen($('undo'), function() {
    tmp.undo();
  });
  Drawing.listen($('brush'), function() { Drawing.setChooserVisibility(true); });
  this.updateResult();
};

Drawing.prototype.setupPicker = function() {
  var tmp = this;
  var colors = $('color_picker').children;
  var sizes = $('size_picker').children;
  var alphas = $('alpha_picker').children;
  var chooser = $('chooser');
  var closeChooser = $('close_chooser');
  Drawing.listen(closeChooser,
                 function() { Drawing.setChooserVisibility(false); });
  for (var i = 0; i < colors.length; i++) {
    Drawing.listen(colors[i], function() { tmp.updateVal(this, 'color'); });
  }
  for (var i = 0; i < sizes.length; i++) {
    Drawing.listen(sizes[i], function(){ tmp.updateVal(this, 'size'); });
  }

  for (var i = 0; i < alphas.length; i++) {
    Drawing.listen(alphas[i], function(){ tmp.updateVal(this, 'alpha') });
  }
};

Drawing.prototype.updateVal = function(val, name) {
  var func = Drawing.getColorFromId;
  if (name === 'alpha') {
    func = Drawing.getAlphaFromId;
  } else if (name === 'size') {
    func = Drawing.getSizeFromId;
  }
  this[name] = func(val.id);
  this.updateResult(val);
};

Drawing.prototype.setupCanvas = function() {
  this.canvas = $('canvas');
  this.canvas.width = document.body.offsetWidth;
  this.canvas.height = document.body.offsetHeight - 100;

  var tmp = this;
  Drawing.listen(this.canvas, function(evt) {
    if (tmp.isPainting) return;
    tmp.isPainting = true;
    tmp.initDrawToCanvas(evt);
  });
  Drawing.listenMove(this.canvas, function(evt) {
    if (!tmp.isPainting) return;
    tmp.drawToCanvas(evt);
  });
  Drawing.listenEnd(document, function(evt) {
    if (tmp.isPainting) {
      tmp.isPainting = false;
      tmp.storeToLocalStorage();
    }
  });
};

Drawing.prototype.getColor = function() {
  return "rgba(" + this.color + ", " + this.alpha + ")";
};


Drawing.prototype.localStorage = function(data) {
  var el = this.pictureName;
  if (data) localStorage[el] = data;
  return localStorage[el];
};

Drawing.prototype.storeToLocalStorage = function() {
  var data = this.localStorage() || "[]";
  data = JSON.parse(data);
  if (data.length > 5) { data = data.slice(1); }
  data.push(this.canvas.toDataURL());
  this.localStorage(JSON.stringify(data));
};

Drawing.prototype.undo = function() {
  var data = this.localStorage();
  if (!data) return;
  data = JSON.parse(data);
  var url = data.pop();
  this.drawImage(url);
  this.localStorage(JSON.stringify(data));
};

Drawing.prototype.drawImage = function(url) {
  var image = new Image();
  var ctx = this.canvas.getContext("2d");
  ctx.clearRect(0, 0, this.canvas.offsetWidth, this.canvas.offsetHeight);
  if (!url) return;
  image.onload = function() {
    ctx.drawImage(this, 0, 0);
  }
  image.src = url;
};

Drawing.prototype.loadLatest = function() {
  var data = this.localStorage();
  if (!data) return;

  data = JSON.parse(data);
  var url = data.pop();
  this.drawImage(url);
  this.localStorage(JSON.stringify([url]));
};

Drawing.prototype.getPoints = function(evt) {
  if (isTouch()) {
    evt = evt.touches[0];
  }
  return [evt.pageX, evt.pageY];
};

Drawing.prototype.initDrawToCanvas = function(evt) {
  var pts = this.getPoints(evt);
  this.px = pts[0] - this.canvas.offsetLeft;
  this.py = pts[1] - this.canvas.offsetTop;
};

Drawing.prototype.drawToCanvas = function(evt) {
  var pts = this.getPoints(evt);
  var ctx = this.canvas.getContext("2d");
  var px = pts[0] - this.canvas.offsetLeft;
  var py = pts[1] - this.canvas.offsetTop;
  this.draw(px, py, ctx);
};

Drawing.prototype.draw = function(x, y, ctx, isPoint) {
  ctx.fillStyle = this.getColor();
  if (isPoint) {
    var size = this.size;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
  } else {
    /** Drawing algorithm from StackOverflow */
    var swap = function(obj) { var c = obj[0]; obj[0] = obj[1]; obj[1] = c;  };
    var diff = function(obj) { return Math.abs(obj[0]-obj[1]);  };
    var xs = [this.px, x];
    var ys = [this.py, y];
    var steep = diff(ys) > diff(xs);
    if (steep) { var t = xs; xs = ys; ys = t;  }
    if (xs[0] > xs[1]) { swap(xs); swap(ys); }
    var dx = xs[1] - xs[0];
    var dy = diff(ys);
    var err = 0;
    var de = dy/dx;
    var yt = ys[0];
    var yStep = (yt < ys[1]) ? 1 : -1;

    for (var xt = xs[0]; xt < xs[1]; xt++) {
      var a = steep ? yt : xt;
      var b = steep ? xt : yt;
      this.draw(a, b, ctx, true);
      err += de;
      if (err >= 0.5) { yt += yStep; err -= 1.0; }
    }
    this.px = x;
    this.py = y;
  }
};


Drawing.prototype.updateResult = function(val) {
  var tmp = this;
  var reset = function(divName) {
    var div = $(divName + '_picker');
    var children = div.children;
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      var size = (divName === 'size') ? Drawing.getSizeFromId(child.id) : 20;
      var color = (divName === 'color') ? Drawing.getColorFromId(child.id) : tmp.color;
      var alpha = (divName === 'alpha') ? Drawing.getAlphaFromId(child.id) : tmp.alpha;
      child.style.width = child.style.height = (2 * size) + 'px';
      child.style.borderRadius = size  + 'px';
      child.style.backgroundColor = "rgba(" + color + "," + (alpha * 5) + ")";
      if (val && val.parentNode.id.match(divName)) {
        child.className = 'unselected';
      }
    }
  };
  var results = ['color','alpha','size'];
  for (var i = 0; i < results.length; i++) {
    reset(results[i]);
  }
  if (val) {
    val.className = 'selected';
  }
};

window.addEventListener('load', function() {
  var drawing = new Drawing();
  drawing.setup();
});


