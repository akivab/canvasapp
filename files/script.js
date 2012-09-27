var getDocHeight = function() {
    var D = document;
    return Math.max(
        Math.max(D.body.scrollHeight, D.documentElement.scrollHeight),
        Math.max(D.body.offsetHeight, D.documentElement.offsetHeight),
        Math.max(D.body.clientHeight, D.documentElement.clientHeight)
    );
};

var isTouch = function() {
  return !!('ontouchstart' in window);
};

var getRandomName = function() {
  var S4 = function(){
    return Math.floor(Math.random() * 0x10000).toString(16);
  };
  return S4()+S4()+S4();
}; 

var Drawing = function(){
  this.pictureName = window.location.hash;
  if (this.pictureName) {
    this.pictureName = this.pictureName.substring(1);
  }
  if (!this.pictureName) {
    window.location.hash = this.pictureName = getRandomName();
  }
  this.data = [];
};

Drawing.prototype.isPainting = false;
Drawing.prototype.alpha = 0.1;
Drawing.prototype.color = "256,0,0";
Drawing.prototype.size = 10;
Drawing.currentDrawing = null;

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

Drawing.run = function(s) {
  eval(s);
};

Drawing.handleData = function(data) {
  if (!data || !Drawing.currentDrawing) {
    Drawing.alertError('Error handling data!');
    return;
  }
  var drawing = Drawing.currentDrawing;
  if (data && data!==drawing.data[0] && confirm("Load data from server?")) {
    drawing.data = [data];
    drawing.storeToLocalStorage();
    drawing.reset();
  }
};

Drawing.handleAlert = function(className, msg, header) {
  $('#alert_bar').html('<div class="'  + className 
  + '"><button type="button" class="close" data-dismiss="alert">×</button><h4>'
  + header
  + '</h4>' + msg + '</div>');
  Drawing.listen($("#alert_bar")[0], function(){ $("#alert_bar")[0].innerHTML = ''; });
};

Drawing.alertOk = function(msg) {
  Drawing.handleAlert('alert alert-success', msg, 'Success');
};

Drawing.alertError = function(msg) {
  Drawing.handleAlert('alert alert-error', msg, 'Error');
};

Drawing.setChooserVisibility = function(bool) {
  $('#chooser')[0].style.visibility = bool ? 'visible' : 'hidden';
  $('#canvas')[0].style.visibility = bool ? 'hidden' : 'visible';
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

Drawing.prototype.setup = function() {
  this.setupCanvas();
  this.setupPicker();
 
  var tmp = this;
  Drawing.listen($('#undo')[0], function() { tmp.undo(); });
  Drawing.listen($('#upload')[0], function(){ tmp.upload(); });
  Drawing.listen($('#open')[0], function() { tmp.openChooser(); });
  Drawing.listen($('#brush')[0], function() { Drawing.setChooserVisibility(true); });
  this.reset();
};

Drawing.prototype.reset = function() {
  $('#title')[0].innerHTML = this.pictureName;
  this.loadLatest();
};

Drawing.prototype.setupPicker = function() {
  var tmp = this;
  var colors = $('#color_picker')[0].children;
  var sizes = $('#size_picker')[0].children;
  var alphas = $('#alpha_picker')[0].children;
  var chooser = $('#chooser')[0];
  var closeChooser = $('#close_chooser')[0];
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
  this.updateResult();
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
  this.canvas = $('#canvas')[0];
  this.canvas.width = document.body.offsetWidth;
  this.canvas.height = window.screen.height - 100;

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
      tmp.appendImage();
    }
  });
};

Drawing.prototype.getColor = function() {
  return "rgba(" + this.color + ", " + this.alpha + ")";
};


Drawing.prototype.localStorage = function(data) {
  var el = this.pictureName;
  if (data !== undefined) localStorage[el] = data;
  if (localStorage[el]) return localStorage[el];
  return "[]";
};

Drawing.prototype.appendImage = function() {
  if (this.data.length > 5) this.data = this.data.splice(1);
  this.data.push(this.canvas.toDataURL());
  this.storeToLocalStorage();
};

Drawing.prototype.storeToLocalStorage = function() {
  console.log(this);
  var url = this.data.pop();
  if (!url) {
    this.localStorage("");
    return;
  }
  this.localStorage(JSON.stringify(url));
  this.data.push(url);
};

Drawing.prototype.loadLatest = function() {
  var data = JSON.parse(this.localStorage());
  this.data = [data];
  this.drawImage(data);
};

Drawing.prototype.undo = function() {
  if (this.data.length <= 1) return;
  this.data.pop();
  var url = this.data[this.data.length-1];
  this.drawImage(url);
  this.storeToLocalStorage();
};

Drawing.prototype.clearCanvas = function() {
  var ctx = this.canvas.getContext("2d");
  ctx.clearRect(0, 0, this.canvas.offsetWidth, this.canvas.offsetHeight);
};

Drawing.prototype.drawImage = function(url) {
  this.clearCanvas();
  var image = new Image();
  var ctx = this.canvas.getContext("2d");
  image.onload = function() {
    ctx.drawImage(this, 0, 0);
  }
  image.src = url;
};

Drawing.prototype.upload = function() {
  var url = '/post';
  var data = JSON.parse(this.localStorage());
  var name = this.pictureName;
  $.ajax({type:'post',url:url,data:{data:data,name:name},success:Drawing.run});
};

Drawing.prototype.open = function(name) {
  this.reset();
  var url = '/get?name=' + encodeURI(this.pictureName);
  $.ajax({type:'get',url:url,success:Drawing.run});
};

Drawing.prototype.openChooser = function() {
  var file = prompt("What's the name?");
  if (file) {
    this.pictureName = window.location.hash = file;
    window.location.reload();
  }
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
  var resetOptions = function(divName) {
    var div = $('#' + divName + '_picker')[0];
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
    resetOptions(results[i]);
  }
  if (val) {
    val.className = 'selected';
  }
};

var updateAppCache = function() {
  window.applicationCache.addEventListener('updateready', function(e) {
    if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {
      window.applicationCache.swapCache();
      window.location.reload();
    }
  }, false);
};


$(document).ready(function() {
    var drawing = new Drawing();
    Drawing.currentDrawing = drawing;
    drawing.setup();
    drawing.open();
    updateAppCache();
});


