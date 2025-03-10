
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
  margin_top = 130;
  margin_bottom = 30;
  
  pulse_width = 8;
  pulse_height = 40;
  
  arrow_width = 6;
  arrow_height = 20;
  arrow_offset = 5;
  
  line_width = 2;
  factor = 2;
  time_steps = 200;
  
  drag_distance = 10;
  dragged_object = null;
  
  y_axis_label = "";
  
  
  constructor(canvas_id, neg_values=false) {
    this.canvas = document.getElementById(canvas_id);
    this.ctx = this.canvas.getContext("2d");
    
    this.allow_negative_values = neg_values;
    if (this.allow_negative_values) {
      this.graph_y = this.margin_top + Math.round(4 * (this.canvas.height - this.margin_top - this.margin_bottom) / 5);
    }
    else {
      this.graph_y = this.canvas.height - this.margin_bottom;
    }
    
    this.graph_x = this.margin_left;
    this.graph_width = this.canvas.width - this.margin_left - this.margin_right;
    this.graph_height = this.graph_y - this.margin_top;
    
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
  
  
  set_factor(factor) {
    this.factor = factor;
    this.refresh();
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
    
    this.ctx.font = "14px Arial";
    this.ctx.textAlign = "left";
    this.ctx.fillText("RF", 2, pulse_y - this.pulse_height / 2);
    
    
    // Draw X and Y axes
    this.ctx.beginPath();
    this.ctx.moveTo(this.graph_x - 0.5, this.margin_top - this.arrow_offset - 0.5);
    if (this.allow_negative_values) this.ctx.lineTo(this.graph_x - 0.5, this.canvas.height);
    else                            this.ctx.lineTo(this.graph_x - 0.5, this.graph_y - 0.5);
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
    this.ctx.fillText(this.y_axis_label, 2, this.margin_top - this.arrow_height - this.arrow_offset);
    
    let text = "Temps";
    let text_width = Math.ceil(this.ctx.measureText(text).width);
    this.ctx.textAlign = "right";
    this.ctx.fillText(text, this.canvas.width - 5, this.graph_y + 22);
    
    
    // Draw Y-axis tick marks and percentage labels
    this.ctx.font = "12px Arial";
    this.ctx.textAlign = "right";
    let start_i, tmp_y;
    
    if (this.allow_negative_values) start_i = -0.3;
    else                            start_i = 0.1;
    
    for (let i = start_i; i <= 1; i += 0.1) {
      tmp_y = this.graph_y - 0.5 - Math.round(this.graph_height * i);
      
      this.ctx.beginPath();
      this.ctx.moveTo(this.graph_x - 5.5, tmp_y);
      this.ctx.lineTo(this.graph_x + 4.5, tmp_y);
      this.ctx.stroke();
      
      this.ctx.fillText(`${Math.round(i*100)} %`, this.graph_x - 8, tmp_y + 4);
    }
    
    
    // Draw X-axis tick marks and corresponding time values
    this.ctx.textAlign = "center";
    let tmp_x, time_steps, toggle;
    
    if (this.factor < 2)       time_steps = 50;
    else if (this.factor < 5)  time_steps = 100;
    else if (this.factor < 10) time_steps = 250;
    else                       time_steps = 500;
    
    if (this.allow_negative_values) {
      start_i = time_steps / this.factor;
      toggle = 1;
    }
    else {
      start_i = 0;
      toggle = 0;
    }
    
    for (let i = start_i; i < this.graph_width-text_width; i += time_steps / this.factor) {
      toggle = 1 - toggle;
      tmp_x = this.graph_x - 0.5 + Math.round(i);
      
      this.ctx.beginPath();
      this.ctx.moveTo(tmp_x, this.graph_y - 5.5);
      this.ctx.lineTo(tmp_x, this.graph_y + 4.5);
      this.ctx.stroke();
      
      if (toggle) this.ctx.fillText(`${Math.round(i*this.factor)} ms`, tmp_x, this.graph_y + 20);
    }
  }
  
  
  get_pulses() {
    return [];
  }
}




class SpinEcho extends InteractiveGraphRenderer {
  y_axis_label = "Signal";
  
  gradient_width = 20;
  gradient_margin = 5;
  gradient_x_offset = 20;
  
  TR = 1500;
  TE = 50;
  min_tr = 100;
  min_te = 5;
  
  
  constructor(canvas_id="canvas", svg_id="svg", tr_id="tr", te_id="te", table_id="table") {
    document.getElementById(canvas_id).width = window.innerWidth - 20;
    super(canvas_id, true);
    
    this.svg = document.getElementById(svg_id);
    
    this.input_TR = document.getElementById(tr_id);
    this.input_TE = document.getElementById(te_id);
    
    this.table = document.getElementById(table_id);
    this.values = [];
    
    
    this.input_TR.addEventListener('change', () => {
      this.set_TR(Math.round(Number(this.input_TR.value)));
      this.refresh();
    });
    
    this.input_TE.addEventListener('change', () => {
      this.set_TE(Math.round(Number(this.input_TE.value)));
      this.refresh();
    });
    
    window.addEventListener('resize', () => {
      this.canvas.width = window.innerWidth - 20;
      this.graph_width = this.canvas.width - this.margin_left - this.margin_right;
      this.refresh();
    });
  }
  
  
  get_dragged_object(event) {
    let rect = this.canvas.getBoundingClientRect();
    let x = event.clientX - rect.left - this.graph_x;
    
    let max_TR = Math.ceil(this.graph_width * this.factor / this.TR);
    
    let offset = 0;
    if (this.TE < this.drag_distance*2) offset = this.drag_distance - this.TE/2;
    
    let tmp_x;
    for (let i = 0; i < max_TR; i++) {
      tmp_x = (this.TR * i + this.TE) / this.factor;
      if (x > tmp_x - this.drag_distance + offset && x < tmp_x + this.drag_distance + offset) return ["TE", i];
      
      tmp_x = this.TR * (i+1) / this.factor;
      if (x > tmp_x - this.drag_distance - offset && x < tmp_x + this.drag_distance - offset) return ["TR", i];
    }
    
    return null;
  }
  
  
  set_TR(value) {
    this.TR = value;
    
    if (this.TR < this.TE + this.min_tr) this.TR = this.TE + this.min_tr;
  }
  
  
  set_TE(value) {
    this.TE = value;
    
    if (this.TE < this.min_te) this.TE = this.min_te;
    if (this.TE > this.TR - this.min_tr) this.TE = this.TR - this.min_tr;
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
  
  
  _T1(t, values) {
    return values["DP"] * (1 - Math.exp(-t/values["T1"]));
  }
  
  
  T1(t, values) {
    let pulse_180 = this.TE / 2;
    
    if (t < pulse_180) {
      return this._T1(t, values);
    }
    else {
      let start = this._T1(pulse_180, values);
      return -start + this._T1(t-pulse_180, values) * (1 + start);
    }
  }
  
  
  T2(t, values) {
    return this.T1(this.TR, values) * Math.exp(-t/values["T2"]);
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
    
    this.ctx.font = "10px Arial";
    this.ctx.textAlign = "center";
    
    
    this.ctx.setLineDash([5]);
    for (let i = 0; true; i++) {
      let x = Math.round(this.graph_x + this.TE/this.factor + i*this.TR/this.factor) - 0.5;
      
      if (x > this.graph_x + this.graph_width) break;
      
      this.ctx.beginPath();
      this.ctx.moveTo(x, this.graph_y-this.graph_height);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
      
      if (i == 0) {
        let text = "TE";
        let width = this.ctx.measureText(text).width;
        let y = this.graph_y + 10;
        
        this.ctx.clearRect(x - width/2, y - 8, width, 10);
        this.ctx.fillText(text, x, y);
      }
    }
    
    this.ctx.setLineDash([]);
    for (let i = 0; true; i++) {
      let x = Math.round(this.graph_x + (i+1)*this.TR/this.factor) - 0.5;
      
      if (x > this.graph_x + this.graph_width) break;
      
      this.ctx.beginPath();
      this.ctx.moveTo(x, this.graph_y-this.graph_height);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
      
      if (i == 0) {
        let text = "TR";
        let width = this.ctx.measureText(text).width;
        let y = this.graph_y + 10;
        
        this.ctx.clearRect(x - width/2, y - 8, width, 10);
        this.ctx.fillText(text, x, y);
      }
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
    
    if (which == "TR")      this.set_TR(Math.round(x / (i+1)));
    else if (which == "TE") this.set_TE(x - this.TR * i);
  }
  
  
  draw_all() {
    this.input_TR.value = this.TR;
    this.input_TE.value = this.TE;
    
    
    let T2_values = [];
    for (let values of this.values) {
      this.draw_curve(values);
      T2_values.push(this.T2(this.TE, values));
    }
    
    this.draw_axes();
    this.draw_bars();
    this.draw_gradient(T2_values);
    this.color_svg(T2_values);
  }
  
  
  zoom(value) {
    this.set_factor(Math.floor(Math.exp((7-value)/2.5)));
  }
}




class AnimatedGraph extends InteractiveGraphRenderer {
  time = 1;
  curve_color = "black";
  RF_pulse = 100;
  tissue_value = 0;
  hline_ratio = 0;
  
  play_state = false;
  timeout = 50;
  
  
  constructor(canvas_id, svg_id, tvalue_id, delay_id, play_id) {
    super(canvas_id);
    
    this.RF_pulse_init = this.RF_pulse;
    
    this.svg = document.getElementById(svg_id);
    
    this.input_tvalue = document.getElementById(tvalue_id);
    this.input_tvalue.addEventListener('change', () => {
      this.set_tissue_value(Math.round(Number(this.input_tvalue.value)));
      this.refresh();
    });
    
    this.delay_checkbox = document.getElementById(delay_id);
    this.delay_checkbox.checked = true;
    this.delay_checkbox.addEventListener('change', () => {
      if (this.RF_pulse) this.RF_pulse = 0;
      else               this.RF_pulse = this.RF_pulse_init;
      
      this.refresh();
    });
    
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
  
  
  set_tissue_value(value) {
    this.tissue_value = value;
    if (this.tissue_value < 10) this.tissue_value = 10;
    
    this.input_tvalue.value = this.tissue_value;
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
  
  
  draw_hline() {
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = "lightgray";
    this.ctx.globalAlpha = 1;
    
    this.ctx.setLineDash([5]);
    
    let y = this.graph_y - Math.round(this.graph_height * this.hline_ratio) - 0.5;
    
    this.ctx.beginPath();
    this.ctx.moveTo(this.graph_x - 0.5, y);
    this.ctx.lineTo(this.canvas.width + this.arrow_offset - this.margin_right + 0.5, y);
    this.ctx.stroke();
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
    this.ctx.globalAlpha = 1;
    
    this.ctx.setLineDash([]);
    
    let x = Math.round(this.graph_x + this.time/this.factor) - 0.5;
    
    this.ctx.beginPath();
    this.ctx.moveTo(x, this.graph_y);
    this.ctx.lineTo(x, this.graph_y - this.graph_height - this.arrow_height);
    this.ctx.stroke();
  }
  
  
  draw_all() {
    this.draw_hline();
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
  y_axis_label = "Mz";
  curve_color = "blue";
  tissue_value = 260;
  hline_ratio = 0.63;
  
  timeout_pause = 1000;
  
  opacity = 0.1;
  
  
  constructor(canvas_id="canvas", svg_id="svg", tvalue_id="tvalue", delay_id="delay", play_id="play-button", b0_id="b0-button", parallel_id="parallel", anti_parallel_id="anti-parallel") {
    super(canvas_id, svg_id, tvalue_id, delay_id, play_id);
    
    this.input_tvalue.value = this.tissue_value;
    
    this.span_parallel = document.getElementById(parallel_id);
    this.span_anti_parallel = document.getElementById(anti_parallel_id);
    
    this.arrows = [];
    this.arrows_bg_count = 0;
    
    for (let item of this.svg.getElementsByTagName("g")) {
      if (item.id == "B0") {
        this.B0 = item;
        this.B0.active = true;
        continue;
      }
      else if (item.id == "vector") {
        [item.init_x, item.init_y] = get_item_translation(item);
        this.vector = item;
        continue;
      }
      
      
      let arrow = item.getElementsByTagName("path")[0];
      item.arrow = arrow;
      item.init_color = arrow.style.stroke;
      
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
      
      this.set_animation(item);
    }
    
    this.arrows = this.arrows.sort(() => Math.random() - 0.5);
    
    this.B0_button = document.getElementById(b0_id);
    this.B0_button.addEventListener('click', (e) => {
      this.set_b0();
    });
  }
  
  
  compute_curve(t) {
    if (!this.B0.active) return 0;
    
    if (t < this.RF_pulse) return 1;
    else                   return 1 - Math.exp((-t + this.RF_pulse)/this.tissue_value);
  }
  
  
  update_svg(fraction) {
    if (!this.B0.active) return;
    
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
    
    this.vector.setAttribute("transform", `matrix(${fraction},0,0,${fraction},${this.vector.init_x},${this.vector.init_y})`);
    
    this.span_parallel.innerText = this.arrows_bg_count / 2 + this.arrows.length - count;
    this.span_anti_parallel.innerText = this.arrows_bg_count / 2 + count;
  }
  
  
  get_timeout() {
    if (this.time == this.RF_pulse)     return this.timeout_pause;
    else if (this.time < this.RF_pulse) return this.timeout;
    else                                return this.timeout * (1 - this.compute_curve(this.time));
  }
  
  
  set_animation(item) {
    item.animateTransform = document.createElementNS("http://www.w3.org/2000/svg", "animateTransform");
    item.animateTransform.setAttribute("attributeType", "xml");
    item.animateTransform.setAttribute("attributeName", "transform");
    item.animateTransform.setAttribute("type", "rotate");
    item.animateTransform.setAttribute("values", "-5 0 0; 5 0 0; -5 0 0");
    item.animateTransform.setAttribute("dur", "0.5s");
    item.animateTransform.setAttribute("additive", "sum");
    item.animateTransform.setAttribute("repeatCount", "indefinite");
    
    item.appendChild(item.animateTransform);
  }
  
  
  set_opacity(opacity) {
    this.opacity = opacity/100;
    
    if (!this.B0.active) return;
    
    for (let item of this.svg.getElementsByClassName("background-protons")) {
      item.style.opacity = this.opacity;
    }
  }
  
  
  set_b0() {
    let protons = [...this.svg.getElementsByClassName("extra-protons"), ...this.svg.getElementsByClassName("background-protons")];
    
    if (this.B0.active) {
      this.B0.active = false;
      this.B0.style.display = "none";
      this.vector.style.display = "none";
      
      for (let item of protons) {
        item.arrow.style.stroke = "red";
        
        item.removeChild(item.animateTransform);
        
        item.animateTransform = document.createElementNS("http://www.w3.org/2000/svg", "animateTransform");
        item.animateTransform.setAttribute("attributeType", "xml");
        item.animateTransform.setAttribute("attributeName", "transform");
        item.animateTransform.setAttribute("type", "rotate");
        item.animateTransform.setAttribute("values", `0 0 0; ${Math.random() * 360 - 180} 0 0`);
        item.animateTransform.setAttribute("dur", "0.5s");
        item.animateTransform.setAttribute("additive", "sum");
        item.animateTransform.setAttribute("repeatCount", "1");
        item.animateTransform.setAttribute("fill", "freeze");
        item.animateTransform.setAttribute("begin", "indefinite");
        
        item.appendChild(item.animateTransform);
        item.animateTransform.beginElement();
        
        if (item.classList.contains("background-protons")) item.style.opacity = 1;
      }
      
      
      this.span_parallel.innerText = "–";
      this.span_anti_parallel.innerText = "–";
      
      this.B0_button.innerText = "Réactiver B0";
    }
    else {
      this.B0.active = true;
      this.B0.style.display = "";
      this.vector.style.display = "";
      
      for (let item of protons) {
        item.arrow.style.stroke = item.init_color;
        
        item.removeChild(item.animateTransform);
        this.set_animation(item);
        
        if (item.classList.contains("background-protons")) item.style.opacity = this.opacity;
      }
      
      this.span_parallel.innerText = "–";
      this.span_anti_parallel.innerText = "–";
      
      this.B0_button.innerText = "Désactiver B0";
    }
      
    this.refresh();
  }
}




class TransverseComponent extends AnimatedGraph {
  y_axis_label = "Mxy";
  curve_color = "red";
  tissue_value = 160;
  hline_ratio = 0.37;
  
  timeout_pause = 1000;
  
  overlay = false;
  animation_timeout = 50;
  animation_progress = 0;
  
  
  constructor(canvas_id="canvas", svg_id="svg", tvalue_id="tvalue", delay_id="delay", play_id="play-button", overlay_id="overlay-button") {
    super(canvas_id, svg_id, tvalue_id, delay_id, play_id);
    
    this.input_tvalue.value = this.tissue_value;
    
    this.protons = [];
    this.arrows = [];
    
    for (let item of this.svg.getElementsByTagName("g")) {
      [item.init_x, item.init_y] = get_item_translation(item);
      
      if (item.id == "vector") {
        this.vector = item;
      }
      else {
        if (this.default_proton === undefined) this.default_proton = item;
        this.protons.push(item);
        
        let arrow = item.getElementsByTagName("path")[0];
        arrow.init_angle = get_item_rotation(arrow);
        this.arrows.push(arrow);
      }
      
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
    else                   return Math.exp((-t + this.RF_pulse)/this.tissue_value);
  }
  
  
  update_svg(fraction) {
    for (let arrow of this.arrows) {
      arrow.setAttribute("transform", `rotate(${arrow.init_angle * (1-fraction)})`);
    }
    
    this.vector.setAttribute("transform", `matrix(${fraction},0,0,${fraction},${this.vector.init_x},${this.vector.init_y})`);
  }
  
  
  get_timeout() {
    if (this.time == this.RF_pulse)     return this.timeout_pause;
    else if (this.time < this.RF_pulse) return this.timeout;
    else                                return this.timeout * this.compute_curve(this.time);
  }
  
  
  overlay_protons() {
    if (this.overlay) {
      this.overlay = false;
      this.overlay_button.innerText = "Superposer";
    }
    else {
      this.overlay = true;
      this.overlay_button.innerText = "Séparer";
    }
    
    if (this.animation_progress == 0 || this.animation_progress == 1) this.overlay_animation();
  }
  
  
  overlay_animation() {
    if (this.overlay) this.animation_progress += 0.1;
    else              this.animation_progress -= 0.1;
    
    if (this.animation_progress < 0) this.animation_progress = 0;
    if (this.animation_progress > 1) this.animation_progress = 1;
    
    let x, y, circle;
    
    for (let item of this.protons) {
      if (item == this.default_proton) continue;
      
      x = item.init_x + this.animation_progress * (this.default_proton.init_x - item.init_x);
      y = item.init_y + this.animation_progress * (this.default_proton.init_y - item.init_y);
      
      item.setAttribute("transform", `translate(${x},${y})`);
      
      circle = item.getElementsByTagName("circle")[0];
      circle.style.opacity = 1-this.animation_progress;
    }
    
    if (this.animation_progress > 0 && this.animation_progress < 1) {
      setTimeout(() => {
        this.overlay_animation();
      }, this.animation_timeout);
    }
  }
}
