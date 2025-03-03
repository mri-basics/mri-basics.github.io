
function get_item_translation(item) {
  for (let transform of item.transform.baseVal) {
    if (transform.type === SVGTransform.SVG_TRANSFORM_TRANSLATE) {
      return [transform.matrix.e, transform.matrix.f];
    }
  }
  
  return [0, 0];
}


function get_item_rotation(item) {
  for (let transform of item.transform.baseVal) {
    if (transform.type === SVGTransform.SVG_TRANSFORM_ROTATE) {
      return transform.angle;
    }
  }
  
  return 0;
}




class InteractiveGraphRenderer {
  margin_left = 10;
  margin_right = 10;
  margin_top = 10;
  margin_bottom = 10;
  
  arrow_width = 6;
  arrow_height = 10;
  
  line_width = 2;
  factor = 2;
  
  allow_negative_values = false;
  
  drag_distance = 8;
  dragged_object = null;
  
  
  constructor(canvas_id) {
    this.canvas = document.getElementById(canvas_id);
    this.ctx = this.canvas.getContext("2d");
    
    this.base_x = this.margin_left;
    this.base_y = this.canvas.height - this.margin_bottom;
    this.max_x = this.canvas.width - this.margin_left - this.margin_right;
    this.max_y = this.canvas.height - this.margin_top - this.margin_bottom;
    
    this.canvas.addEventListener('mousedown', (e) => {
      this.dragged_object = this.get_dragged_object(e);
      if (this.dragged_object) this.refresh(e);
    });
    
    this.canvas.addEventListener('mousemove', (e) => {
      if (this.dragged_object) this.refresh(e);
      else                     this.refresh_cursor(e);
    });
    
    this.canvas.addEventListener('mouseup', () => {
      this.dragged_object = null;
    });
    
    this.canvas.addEventListener('mouseleave', () => {
      this.dragged_object = null;
    });
  }
  
  
  get_dragged_object(event) {
    return null;
  }
  
  
  refresh_cursor(event) {
    let dragged_object = this.get_dragged_object(event);
    
    if (dragged_object && !this.canvas.style.cursor) this.canvas.style.cursor = "w-resize";
    else if (!dragged_object && this.canvas.style.cursor) this.canvas.style.cursor = "";
  }
  
  
  refresh(event=null) {
    if (event && this.dragged_object) {
      let rect = this.canvas.getBoundingClientRect();
      let x = event.clientX - rect.left - this.base_x;
      
      this.update_drag_n_drop(x * this.factor, null);
    }
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.draw_all();
  }
  
  
  update_drag_n_drop(x, y) {
  }
  
  
  draw_all() {
    this.draw_axes();
  }
  
  
  draw_axes() {
    if (!this.allow_negative_values) this.ctx.clearRect(0, this.base_y, this.canvas.width, this.margin_bottom);
    
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = "black";
    this.ctx.fillStyle = "black";
    this.ctx.globalAlpha = 1;
    this.ctx.setLineDash([]);
    
    this.ctx.beginPath();
    this.ctx.moveTo(this.base_x - 0.5, this.margin_top - 0.5);
    this.ctx.lineTo(this.base_x - 0.5, this.base_y - 0.5);
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.moveTo(this.base_x - 0.5, this.base_y - 0.5);
    this.ctx.lineTo(this.canvas.width - this.margin_right + 0.5, this.base_y - 0.5);
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.moveTo(this.base_x - 0.5 - this.arrow_width/2, this.margin_top);
    this.ctx.lineTo(this.base_x - 0.5, this.margin_top - this.arrow_height);
    this.ctx.lineTo(this.base_x - 0.5 + this.arrow_width/2, this.margin_top);
    this.ctx.fill();
    
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width - this.margin_right, this.base_y - 0.5 - this.arrow_width/2);
    this.ctx.lineTo(this.canvas.width - this.margin_right + this.arrow_height, this.base_y - 0.5);
    this.ctx.lineTo(this.canvas.width - this.margin_right, this.base_y - 0.5 + this.arrow_width/2);
    this.ctx.fill();
  }
}




class SpinEcho extends InteractiveGraphRenderer {
  gradient_width = 20;
  gradient_margin = 5;
  gradient_x_offset = 20;
  
  TR = 1500;
  TE = 50;
  min_tr = 10;
  min_te = 5;
  
  
  constructor(canvas_id, svg_id, tr_id, te_id, table_id) {
    super(canvas_id);
    
    this.svg = document.getElementById(svg_id);
    
    this.span_TR = document.getElementById(tr_id);
    this.span_TE = document.getElementById(te_id);
    
    this.table = document.getElementById(table_id);
    this.values = [];
  }
  
  
  get_dragged_object(event) {
    let rect = this.canvas.getBoundingClientRect();
    let x = event.clientX - rect.left - this.base_x;
    
    let max_TR = Math.ceil(this.max_x * this.factor / this.TR);
    
    for (let i = 0; i < max_TR; i++) {
      if (Math.abs(x - ((this.TR * i + this.TE) / this.factor)) < this.drag_distance) return ["TE", i];
      if (Math.abs(x - (this.TR * (i+1) / this.factor)) < this.drag_distance) return ["TR", i];
    }
    
    return null;
  }
  
  
  set_tissue(name, id, color, T1, T2, DP, show) {
    
    let tr = document.createElement("tr");
    tr.style.color = color;
    
    let td = document.createElement("td");
    tr.appendChild(td);
    
    let input = document.createElement("input");
    input.setAttribute("type", "checkbox");
    input.setAttribute("id", id);
    if (show) input.checked = true;
    td.appendChild(input);
    
    input.addEventListener('change', (e) => {
      this.refresh();
    });
    
    let label = document.createElement("label");
    label.setAttribute("for", id);
    label.style.marginLeft = "5px";
    label.innerHTML = name;
    td.appendChild(label);
    
    td = document.createElement("td");
    td.innerHTML = T1;
    tr.appendChild(td);
    
    td = document.createElement("td");
    td.innerHTML = T2;
    tr.appendChild(td);
    
    td = document.createElement("td");
    td.innerHTML = DP;
    tr.appendChild(td);
    
    this.table.appendChild(tr);
    
    this.values.push({"class": id, "color": color, "T1": T1, "T2": T2, "DP": DP, "checkbox": input});
  }
  
  
  preset(TR, TE) {
    this.TR = TR;
    this.TE = TE;
    this.refresh();
  }
  
  
  T1(t, values) {
    return values["DP"] * (1 - Math.exp(-t/values["T1"]));
  }
  
  
  T2(t, values) {
    return values["DP"] * (1 - Math.exp(-this.TR/values["T1"])) * Math.exp(-t/values["T2"]);
  }
  
  
  draw_func(func, start, values) {
    let x = 0, y = 0;
    
    this.ctx.beginPath();
    
    for (let i = 0; i < this.TR/this.factor; i++) {
      x = this.base_x + start + i;
      if (x > this.base_x + this.max_x) break;
      
      y = this.base_y - func.call(this, i*this.factor, values) * this.max_y;
      
      if (i == 0) this.ctx.moveTo(x, y);
      else        this.ctx.lineTo(x, y);
    }
    
    this.ctx.stroke();
  }
  
  
  draw_curve(values) {
    if (!values["checkbox"].checked) return;
    
    this.ctx.lineWidth = this.line_width;
    this.ctx.strokeStyle = values["color"];
    this.ctx.setLineDash([]);
    
    for (let j = 0; true; j++) {
      let start = j*this.TR/this.factor;
      
      if (start > this.base_x + this.max_x) break;
      
      if (j == 1) this.ctx.globalAlpha = 1;
      else        this.ctx.globalAlpha = 0.1;
      this.draw_func(this.T2, start, values);
      
      if (j == 0) this.ctx.globalAlpha = 1;
      else        this.ctx.globalAlpha = 0.1;
      this.draw_func(this.T1, start, values);
    }
  }
  
  
  draw_bars() {
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = "black";
    this.ctx.fillStyle = "black";
    this.ctx.globalAlpha = 1;
    
    this.ctx.setLineDash([5]);
    for (let j = 0; true; j++) {
      let x = Math.round(this.base_x + this.TE/this.factor + j*this.TR/this.factor) - 0.5;
      
      if (x > this.base_x + this.max_x) break;
      
      this.ctx.beginPath();
      this.ctx.moveTo(x, this.base_y);
      this.ctx.lineTo(x, this.base_y-this.max_y);
      this.ctx.stroke();
    }
    
    this.ctx.setLineDash([]);
    for (let j = 0; true; j++) {
      let x = Math.round(this.base_x + (j+1)*this.TR/this.factor) - 0.5;
      
      if (x > this.base_x + this.max_x) break;
      
      this.ctx.beginPath();
      this.ctx.moveTo(x, this.base_y);
      this.ctx.lineTo(x, this.base_y-this.max_y);
      this.ctx.stroke();
    }
  }
  
  
  draw_gradient(T2_values) {
    // Draw colored dots on curves
    for (let i = 0; i < this.values.length; i++) {
      if (this.values[i]["checkbox"].checked) {
        this.ctx.beginPath();
        this.ctx.arc(this.base_x + (this.TR + this.TE) / this.factor, this.base_y - T2_values[i] * this.max_y, 4, 0, 2 * Math.PI);
        this.ctx.fillStyle = this.values[i]["color"];
        this.ctx.fill();
      }
    }
    
    // Draw gradient
    let min = Math.min(...T2_values);
    let max = Math.max(...T2_values);
    
    let x = this.base_x + (this.TR + this.TE) / this.factor;
    let y = Math.round(this.base_y - max * this.max_y);
    let height = Math.round((max-min) * this.max_y);
    
    let grad = this.ctx.createLinearGradient(0, y, 0, y + height);
    grad.addColorStop(0, "white");
    grad.addColorStop(1, "black");
    
    this.ctx.beginPath();
    
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(x + this.gradient_x_offset, y - this.gradient_margin, this.gradient_width, height + this.gradient_margin*2);
    
    this.ctx.strokeStyle = "gray";
    this.ctx.rect(x + this.gradient_x_offset, y - this.gradient_margin, this.gradient_width, height + this.gradient_margin*2);
    this.ctx.stroke();
    
    // Draw lines between dots and gradient
    this.ctx.setLineDash([2]);
    
    for (let i = 0; i < this.values.length; i++) {
      if (this.values[i]["checkbox"].checked) {
        y = Math.round(this.base_y - T2_values[i] * this.max_y);
        
        this.ctx.strokeStyle = this.values[i]["color"];
        
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - 0.5);
        this.ctx.lineTo(x + this.gradient_x_offset + this.gradient_width, y - 0.5);
        this.ctx.stroke();
      }
    }
  }
  
  
  color_svg(T2_values) {
    let min = Math.min(...T2_values);
    let max = Math.max(...T2_values);
    
    for (let i = 0; i < this.values.length; i++) {
      let value = Math.round(255 * (T2_values[i] - min) / (max - min));
      let color = `rgb(${value} ${value} ${value})`;
      
      for (let item of this.svg.getElementsByClassName(this.values[i]["class"])) item.style.fill = color;
    }
  }
  
  
  update_drag_n_drop(x, y) {
    let which, i;
    [which, i] = this.dragged_object;
    
    if (which == "TR") {
      this.TR = Math.round(x / (i+1));
      if (this.TR < this.TE + this.min_tr) this.TR = this.TE + this.min_tr;
    }
    else if (which == "TE") {
      this.TE = x - this.TR * i;
      if (this.TE < this.min_te) this.TE = this.min_te;
      if (this.TE > this.TR - this.min_tr) this.TE = this.TR - this.min_tr;
    }
  }
  
  
  draw_all() {
    this.span_TR.innerHTML = this.TR;
    this.span_TE.innerHTML = this.TE;
    
    
    let T2_values = [];
    for (let i = 0; i < this.values.length; i++) {
      this.draw_curve(this.values[i]);
      T2_values.push(this.T2(this.TE, this.values[i]));
    }
    
    this.draw_axes();
    this.draw_bars();
    this.draw_gradient(T2_values);
    this.color_svg(T2_values);
  }
}




class AnimatedGraph extends InteractiveGraphRenderer {
  time = 1;
  curve_color = "black";
  RF_pulse = 100;
  
  play = false;
  timeout = 50;
  
  
  constructor(canvas_id, svg_id, play_id) {
    super(canvas_id);
    
    this.svg = document.getElementById(svg_id);
    
    this.play_button = document.getElementById(play_id);
    this.play_button.addEventListener('click', (e) => {
      this.play_pause();
    });
  }
  
  
  get_dragged_object(event) {
    let rect = this.canvas.getBoundingClientRect();
    let x = event.clientX - rect.left - this.base_x;
    
    if (Math.abs(x - (this.time / this.factor)) < this.drag_distance) return true;
    else                                                              return null;
  }
  
  
  update_drag_n_drop(x, y) {
    this.time = x;
    if (this.time < 1) this.time = 1;
  }
  
  
  compute_curve(t) {
    return 0;
  }
  
  
  draw_curve() {
    this.ctx.lineWidth = this.line_width;
    this.ctx.strokeStyle = this.curve_color;
    this.ctx.setLineDash([]);
    this.ctx.beginPath();
    
    let x = 0, y = 0;
    
    for (let i = 0; i < this.base_x + this.max_x; i++) {
      x = this.base_x + i;
      y = this.base_y - this.compute_curve(i*this.factor) * this.max_y;
      
      if (i == 0) this.ctx.moveTo(x, y);
      else        this.ctx.lineTo(x, y);
    }
    
    this.ctx.stroke();
  }
  
  
  draw_bar() {
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = "black";
    this.ctx.fillStyle = "black";
    this.ctx.globalAlpha = 1;
    
    this.ctx.setLineDash([5]);
    let x = Math.round(this.base_x + this.time/this.factor) - 0.5;
    
    this.ctx.beginPath();
    this.ctx.moveTo(x, this.base_y);
    this.ctx.lineTo(x, this.base_y-this.max_y-this.arrow_height);
    this.ctx.stroke();
  }
  
  
  draw_all() {
    this.draw_curve();
    this.draw_axes();
    this.draw_bar();
    
    this.update_svg(this.compute_curve(this.time));
  }
  
  
  play_pause() {
    if (this.play) {
      this.play = false;
      this.play_button.innerText = "Play";
    }
    else {
      setTimeout(() => {
        this.update_progress();
      }, this.timeout);
      
      this.play = true;
      this.play_button.innerText = "Pause";
    }
  }
  
  
  update_svg(fraction) {
  }
  
  
  update_progress() {
    this.time += this.factor;
    if (this.time/this.factor > this.base_x + this.max_x) this.time = 1;
    if (this.time > this.RF_pulse && this.time - this.RF_pulse < this.factor) this.time = this.RF_pulse;
    
    this.refresh();
    
    if (!this.play) return;
    
    setTimeout(() => {
      this.update_progress();
    }, this.get_timeout());
  }
  
  
  get_timeout() {
    return this.timeout;
  }
}




class TransverseComponent extends AnimatedGraph {
  curve_color = "red";
  T2_value = 160;
  
  timeout_pause = 1000;
  
  overlay = false;
  
  
  constructor(canvas_id, svg_id, play_id, overlay_id) {
    super(canvas_id, svg_id, play_id);
    
    this.arrows = [];
    
    for (let item of this.svg.getElementsByTagName("g")) {
      if (this.default_proton === undefined) this.default_proton = item;
      
      [item.init_x, item.init_y] = get_item_translation(item);
      
      let arrow = item.getElementsByTagName("path")[0];
      arrow.init_angle = get_item_rotation(arrow);
      this.arrows.push(arrow);
      
      let animateTransform = document.createElementNS("http://www.w3.org/2000/svg", "animateTransform");
      animateTransform.setAttribute("attributeType", "xml");
      animateTransform.setAttribute("attributeName", "transform");
      animateTransform.setAttribute("type", "rotate");
      animateTransform.setAttribute("from", "0 0 0");
      animateTransform.setAttribute("to", "360 0 0");
      animateTransform.setAttribute("dur", "2s");
      animateTransform.setAttribute("additive", "sum");
      animateTransform.setAttribute("repeatCount", "indefinite");
      
      item.appendChild(animateTransform);
    }
    
    
    this.overlay_button = document.getElementById(overlay_id);
    this.overlay_button.addEventListener('click', (e) => {
      this.overlay_protons();
    });
  }
  
  
  compute_curve(t) {
    if (t < this.RF_pulse) return 0;
    else                   return Math.exp((-t + this.RF_pulse)/this.T2_value);
  }
  
  
  update_svg(fraction) {
    for (let arrow of this.arrows) {
      arrow.setAttribute("transform", `rotate(${arrow.init_angle * (1-fraction)})`);
    }
  }
  
  
  get_timeout() {
    if (this.time == this.RF_pulse)     return this.timeout_pause;
    else if (this.time < this.RF_pulse) return this.timeout;
    else                                return this.timeout * this.compute_curve(this.time);
  }
  
  
  overlay_protons() {
    if (this.overlay) {
      for (let item of this.svg.getElementsByTagName("g")) {
        if (item == this.default_proton) continue;
        
        item.setAttribute("transform", `translate(${item.init_x},${item.init_y})`);
        let circle = item.getElementsByTagName("circle")[0];
        circle.style.display = "";
      }
      
      this.overlay = false;
      this.overlay_button.innerText = "Superposer";
    }
    else {
      for (let item of this.svg.getElementsByTagName("g")) {
        if (item == this.default_proton) continue;
        
        item.setAttribute("transform", `translate(${this.default_proton.init_x},${this.default_proton.init_y})`);
        let circle = item.getElementsByTagName("circle")[0];
        circle.style.display = "None";
      }
      
      this.overlay = true;
      this.overlay_button.innerText = "Séparer";
    }
  }
}




class LongitudinalComponent extends AnimatedGraph {
  curve_color = "blue";
  T1_value = 260;
  
  timeout_pause = 1000;
  
  
  constructor(canvas_id, svg_id, play_id) {
    super(canvas_id, svg_id, play_id);
    
    this.arrows = [];
    
    for (let item of this.svg.getElementsByTagName("g")) {
      let arrow = item.getElementsByTagName("path")[0];
      
      if (this.parallel === undefined) {
        this.parallel = arrow;
      }
      else if (this.anti_parallel === undefined) {
        this.anti_parallel = arrow;
      }
      
      if (item.style.opacity == "1") this.arrows.push(arrow);
      
      let animateTransform = document.createElementNS("http://www.w3.org/2000/svg", "animateTransform");
      animateTransform.setAttribute("attributeType", "xml");
      animateTransform.setAttribute("attributeName", "transform");
      animateTransform.setAttribute("type", "rotate");
      animateTransform.setAttribute("values", "-5 0 0; 5 0 0; -5 0 0");
      animateTransform.setAttribute("dur", "0.5s");
      animateTransform.setAttribute("additive", "sum");
      animateTransform.setAttribute("repeatCount", "indefinite");
      
      item.appendChild(animateTransform);
    }
    
    this.arrows = this.arrows.sort(() => Math.random() - 0.5);
  }
  
  
  compute_curve(t) {
    if (t < this.RF_pulse) return 1;
    else                   return 1 - Math.exp((-t + this.RF_pulse)/this.T1_value);
  }
  
  
  update_svg(fraction) {
    let length = this.arrows.length / 2;
    let arrow;
    
    for (let i = 0; i < length; i++) {
      arrow = this.arrows[i];
      
      if (i <= Math.round(fraction * length)-1) {
        arrow.style.stroke = this.parallel.style.stroke;
        arrow.style.markerStart = this.parallel.style.markerStart;
        arrow.style.markerEnd = this.parallel.style.markerEnd;
      }
      else {
        arrow.style.stroke = this.anti_parallel.style.stroke;
        arrow.style.markerStart = this.anti_parallel.style.markerStart;
        arrow.style.markerEnd = this.anti_parallel.style.markerEnd;
      }
    }
  }
  
  
  get_timeout() {
    if (this.time == this.RF_pulse)     return this.timeout_pause;
    else if (this.time < this.RF_pulse) return this.timeout;
    else                                return this.timeout * (1 - this.compute_curve(this.time));
  }
}

