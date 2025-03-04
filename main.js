
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
  margin_left = 50;
  margin_right = 20;
  margin_top = 100;
  margin_bottom = 30;
  
  pulse_width = 8;
  pulse_height = 40;
  
  arrow_width = 6;
  arrow_height = 10;
  arrow_offset = 5;
  
  line_width = 2;
  factor = 2;
  time_steps = 200;
  
  allow_negative_values = false;
  
  drag_distance = 8;
  dragged_object = null;
  
  
  constructor(canvas_id) {
    this.canvas = document.getElementById(canvas_id);
    this.ctx = this.canvas.getContext("2d");
    
    this.graph_x = this.margin_left;
    this.graph_y = this.canvas.height - this.margin_bottom;
    this.graph_width = this.canvas.width - this.margin_left - this.margin_right;
    this.graph_height = this.canvas.height - this.margin_top - this.margin_bottom;
    
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
      let x = event.clientX - rect.left - this.graph_x;
      
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
    // If negative values are not allowed, clear the bottom margin area
    if (!this.allow_negative_values) this.ctx.clearRect(0, this.graph_y + 0.5, this.canvas.width, this.margin_bottom);
    
    // Set drawing properties
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = "black";
    this.ctx.fillStyle = "black";
    this.ctx.globalAlpha = 1;
    this.ctx.setLineDash([]);
    
    
    // Draw pulse timeline
    this.ctx.font = "10px Arial";
    this.ctx.textAlign = "center";
    
    let pulse_y = 50.5;
    this.ctx.beginPath();
    this.ctx.moveTo(this.graph_x - this.pulse_width, pulse_y);
    
    let angle, time, angle_ratio, ratio;
    for (let pulse of this.get_pulses()) {
      [angle, time] = pulse;
      angle_ratio = angle / 180;
      
      this.ctx.fillText(`${angle}°`, this.graph_x + time / this.factor, 10 + this.pulse_height - this.pulse_height * angle_ratio);
      
      let start = this.graph_x + time / this.factor - this.pulse_width/2;
      this.ctx.lineTo(start, pulse_y);
      
      for (let i = 0; i < this.pulse_width; i++) {
        if (i < this.pulse_width/2) ratio = 2 * i / this.pulse_width;
        else                        ratio = 2 - 2 * i / this.pulse_width;
        
        this.ctx.lineTo(start + i, pulse_y - ratio * (this.pulse_height * Math.sin(Math.PI * i / 2)) * angle_ratio);
      }
      
      this.ctx.lineTo(start + this.pulse_width, pulse_y);
    }
    
    this.ctx.lineTo(this.canvas.width + this.arrow_offset - this.margin_right + 0.5, pulse_y);
    this.ctx.stroke();
    
    
    // Draw X and Y axes
    this.ctx.beginPath();
    this.ctx.moveTo(this.graph_x - 0.5, this.margin_top - this.arrow_offset - 0.5);
    this.ctx.lineTo(this.graph_x - 0.5, this.graph_y - 0.5);
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.moveTo(this.graph_x - 0.5, this.graph_y - 0.5);
    this.ctx.lineTo(this.canvas.width + this.arrow_offset - this.margin_right + 0.5, this.graph_y - 0.5);
    this.ctx.stroke();
    
    
    // Draw arrowheads at the ends of both axes
    this.ctx.beginPath();
    this.ctx.moveTo(this.graph_x - 0.5 - this.arrow_width/2, this.margin_top - this.arrow_offset);
    this.ctx.lineTo(this.graph_x - 0.5, this.margin_top - this.arrow_offset - this.arrow_height);
    this.ctx.lineTo(this.graph_x - 0.5 + this.arrow_width/2, this.margin_top - this.arrow_offset);
    this.ctx.fill();
    
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width - this.margin_right + this.arrow_offset, this.graph_y - 0.5 - this.arrow_width/2);
    this.ctx.lineTo(this.canvas.width - this.margin_right + this.arrow_offset + this.arrow_height, this.graph_y - 0.5);
    this.ctx.lineTo(this.canvas.width - this.margin_right + this.arrow_offset, this.graph_y - 0.5 + this.arrow_width/2);
    this.ctx.fill();
    
    
    // Write axis labels
    this.ctx.font = "14px Arial";
    this.ctx.textAlign = "left";
    this.ctx.fillText("Signal", 2, this.margin_top - this.arrow_height - this.arrow_offset);
    
    let text = "Temps";
    let text_width = Math.ceil(this.ctx.measureText(text).width);
    this.ctx.textAlign = "right";
    this.ctx.fillText(text, this.canvas.width - 5, this.graph_y + 22);
    
    
    // Draw Y-axis tick marks and percentage labels
    this.ctx.font = "12px Arial";
    this.ctx.textAlign = "right";
    let tmp_y;
    
    for (let i = 0.25; i <= 1; i += 0.25) {
      tmp_y = this.graph_y - 0.5 - Math.round(this.graph_height * i);
      
      this.ctx.beginPath();
      this.ctx.moveTo(this.graph_x - 5.5, tmp_y);
      this.ctx.lineTo(this.graph_x + 4.5, tmp_y);
      this.ctx.stroke();
      
      this.ctx.fillText(`${i*100} %`, this.graph_x - 8, tmp_y + 4);
    }
    
    
    // Draw X-axis tick marks and corresponding time values
    this.ctx.textAlign = "center";
    let tmp_x;
    
    for (let i = 0; i < this.graph_width-text_width; i += this.time_steps / this.factor) {
      tmp_x = this.graph_x - 0.5 + i;
      
      this.ctx.beginPath();
      this.ctx.moveTo(tmp_x, this.graph_y - 5.5);
      this.ctx.lineTo(tmp_x, this.graph_y + 4.5);
      this.ctx.stroke();
      
      this.ctx.fillText(`${i*this.factor} ms`, tmp_x, this.graph_y + 20);
    }
  }
  
  
  get_pulses() {
    return [];
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
  
  
  constructor(canvas_id="canvas", svg_id="svg", tr_id="tr", te_id="te", table_id="table") {
    document.getElementById(canvas_id).width = window.innerWidth - 20;
    super(canvas_id);
    
    this.svg = document.getElementById(svg_id);
    
    this.span_TR = document.getElementById(tr_id);
    this.span_TE = document.getElementById(te_id);
    
    this.table = document.getElementById(table_id);
    this.values = [];
    
    window.addEventListener('resize', () => {
      this.resize();
    });
  }
  
  
  get_dragged_object(event) {
    let rect = this.canvas.getBoundingClientRect();
    let x = event.clientX - rect.left - this.graph_x;
    
    let max_TR = Math.ceil(this.graph_width * this.factor / this.TR);
    
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
      x = this.graph_x + start + i;
      if (x > this.graph_x + this.graph_width) break;
      
      y = this.graph_y - func.call(this, i*this.factor, values) * this.graph_height;
      
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
    
    let start;
    for (let i = 0; true; i++) {
      start = i * this.TR / this.factor;
      
      if (start > this.graph_x + this.graph_width) break;
      
      if (i == 1) this.ctx.globalAlpha = 1;
      else        this.ctx.globalAlpha = 0.1;
      this.draw_func(this.T2, start, values);
      
      if (i == 0) this.ctx.globalAlpha = 1;
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
    for (let i = 0; true; i++) {
      let x = Math.round(this.graph_x + this.TE/this.factor + i*this.TR/this.factor) - 0.5;
      
      if (x > this.graph_x + this.graph_width) break;
      
      this.ctx.beginPath();
      this.ctx.moveTo(x, this.graph_y);
      this.ctx.lineTo(x, this.graph_y-this.graph_height);
      this.ctx.stroke();
    }
    
    this.ctx.setLineDash([]);
    for (let i = 0; true; i++) {
      let x = Math.round(this.graph_x + (i+1)*this.TR/this.factor) - 0.5;
      
      if (x > this.graph_x + this.graph_width) break;
      
      this.ctx.beginPath();
      this.ctx.moveTo(x, this.graph_y);
      this.ctx.lineTo(x, this.graph_y-this.graph_height);
      this.ctx.stroke();
    }
  }
  
  
  draw_gradient(T2_values) {
    // Draw colored dots on curves
    for (let i = 0; i < this.values.length; i++) {
      if (this.values[i]["checkbox"].checked) {
        this.ctx.beginPath();
        this.ctx.arc(this.graph_x + (this.TR + this.TE) / this.factor, this.graph_y - T2_values[i] * this.graph_height, 4, 0, 2 * Math.PI);
        this.ctx.fillStyle = this.values[i]["color"];
        this.ctx.fill();
      }
    }
    
    // Draw gradient
    let min = Math.min(...T2_values);
    let max = Math.max(...T2_values);
    
    let x = this.graph_x + (this.TR + this.TE) / this.factor;
    let y = Math.round(this.graph_y - max * this.graph_height);
    let height = Math.round((max-min) * this.graph_height);
    
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
        y = Math.round(this.graph_y - T2_values[i] * this.graph_height);
        
        this.ctx.strokeStyle = this.values[i]["color"];
        
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - 0.5);
        this.ctx.lineTo(x + this.gradient_x_offset + this.gradient_width, y - 0.5);
        this.ctx.stroke();
      }
    }
  }
  
  
  get_pulses() {
    let pulses = [];
    
    let start;
    for (let i = 0; true; i++) {
      start = i * this.TR;
      
      if (start / this.factor > this.graph_x + this.graph_width) break;
      
      pulses.push([90, start]);
      pulses.push([180, start + this.TE / 2]);
    }
    
    return pulses;
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
    for (let value of this.values) {
      this.draw_curve(value);
      T2_values.push(this.T2(this.TE, value));
    }
    
    this.draw_axes();
    this.draw_bars();
    this.draw_gradient(T2_values);
    this.color_svg(T2_values);
  }
  
  
  resize() {
    this.canvas.width = window.innerWidth - 20;
    this.graph_width = this.canvas.width - this.margin_left - this.margin_right;
    this.refresh();
  }
}




class AnimatedGraph extends InteractiveGraphRenderer {
  time = 1;
  curve_color = "black";
  RF_pulse = 100;
  
  play_state = false;
  timeout = 50;
  
  
  constructor(canvas_id, svg_id, play_id) {
    super(canvas_id);
    
    this.svg = document.getElementById(svg_id);
    
    this.play_button = document.getElementById(play_id);
    this.play_button.addEventListener('click', (e) => {
      this.play();
    });
  }
  
  
  get_dragged_object(event) {
    let rect = this.canvas.getBoundingClientRect();
    let x = event.clientX - rect.left - this.graph_x;
    
    if (Math.abs(x - (this.time / this.factor)) < this.drag_distance) return true;
    else                                                              return null;
  }
  
  
  update_drag_n_drop(x, y) {
    this.time = x;
    if (this.time < 1) this.time = 1;
    else if (this.time > this.graph_width * this.factor) this.time = this.graph_width * this.factor;
    
    if (this.play_state) this.play(false);
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
    
    for (let i = 0; i < this.graph_width; i++) {
      x = this.graph_x + i;
      y = this.graph_y - this.compute_curve(i * this.factor) * this.graph_height;
      
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
    let x = Math.round(this.graph_x + this.time/this.factor) - 0.5;
    
    this.ctx.beginPath();
    this.ctx.moveTo(x, this.graph_y);
    this.ctx.lineTo(x, this.graph_y - this.graph_height - this.arrow_height);
    this.ctx.stroke();
  }
  
  
  draw_all() {
    this.draw_curve();
    this.draw_axes();
    this.draw_bar();
    
    this.update_svg(this.compute_curve(this.time));
  }
  
  
  get_pulses() {
    return [[90, this.RF_pulse]];
  }
  
  
  play(state=null) {
    if (state === null)          this.play_state = !this.play_state;
    else if (state == this.play_state) return;
    else                         this.play_state = state;
    
    if (this.play_state) {
      setTimeout(() => {
        this.update_progress();
      }, this.timeout);
      
      this.play_button.innerText = "Pause";
    }
    else {
      this.play_button.innerText = "Play";
    }
  }
  
  
  update_svg(fraction) {
  }
  
  
  update_progress() {
    this.time += this.factor;
    if (this.time > this.graph_width * this.factor) this.time = 1;
    if (this.time > this.RF_pulse && this.time - this.RF_pulse < this.factor) this.time = this.RF_pulse;
    
    this.refresh();
    
    if (!this.play_state) return;
    
    setTimeout(() => {
      this.update_progress();
    }, this.get_timeout());
  }
  
  
  get_timeout() {
    return this.timeout;
  }
}




class LongitudinalComponent extends AnimatedGraph {
  curve_color = "blue";
  T1_value = 260;
  
  timeout_pause = 1000;
  
  
  constructor(canvas_id="canvas", svg_id="svg", play_id="play-button", parallel_id="parallel", anti_parallel_id="anti-parallel") {
    super(canvas_id, svg_id, play_id);
    
    this.span_parallel = document.getElementById(parallel_id);
    this.span_anti_parallel = document.getElementById(anti_parallel_id);
    
    this.arrows = [];
    this.arrows_bg_count = 0;
    
    for (let item of this.svg.getElementsByTagName("g")) {
      if (item.id == "B0") continue;
      
      let arrow = item.getElementsByTagName("path")[0];
      
      if (this.parallel === undefined) {
        this.parallel = arrow;
      }
      else if (this.anti_parallel === undefined) {
        this.anti_parallel = arrow;
      }
      
      if (item.style.opacity == "1") {
        item.setAttribute("class", "extra-protons");
        this.arrows.push(arrow);
      }
      else {
        item.setAttribute("class", "background-protons");
        this.arrows_bg_count++;
      }
      
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
    let count = 0;
    
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
        count++;
      }
    }
    
    this.span_parallel.innerText = this.arrows_bg_count / 2 + this.arrows.length - count;
    this.span_anti_parallel.innerText = this.arrows_bg_count / 2 + count;
  }
  
  
  get_timeout() {
    if (this.time == this.RF_pulse)     return this.timeout_pause;
    else if (this.time < this.RF_pulse) return this.timeout;
    else                                return this.timeout * (1 - this.compute_curve(this.time));
  }
  
  
  set_opacity(opacity) {
    for (let item of this.svg.getElementsByClassName("background-protons")) {
      item.style.opacity = opacity/100;
    }
  }
}




class TransverseComponent extends AnimatedGraph {
  curve_color = "red";
  T2_value = 160;
  
  timeout_pause = 1000;
  
  overlay = false;
  
  
  constructor(canvas_id="canvas", svg_id="svg", play_id="play-button", overlay_id="overlay-button") {
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
