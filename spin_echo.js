
class SpinEcho {
  margin_left = 10;
  margin_right = 10;
  margin_top = 10;
  margin_bottom = 10;
  
  arrow_width = 6;
  arrow_height = 10;
  
  line_width = 2;
  factor = 2;
  
  min_tr = 10;
  min_te = 5;
  
  TR = 1500;
  TE = 50;
  
  dragged_object = null;
  
  
  constructor(canvas_id, svg_id, tr_id, te_id, table_id) {
    this.canvas = document.getElementById(canvas_id);
    this.ctx = this.canvas.getContext("2d");
    
    this.base_x = this.margin_left;
    this.base_y = this.canvas.height - this.margin_bottom;
    this.max_x = this.canvas.width - this.margin_left - this.margin_right;
    this.max_y = this.canvas.height - this.margin_top - this.margin_bottom;
    
    this.svg = document.getElementById(svg_id);
    
    this.span_TR = document.getElementById(tr_id);
    this.span_TE = document.getElementById(te_id);
    
    this.table = document.getElementById(table_id);
    this.values = [];
    
    
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
  
  
  set_tissue(label, className, color, T1, T2, DP, show) {
    this.values.push({"class": className, "color": color, "T1": T1, "T2": T2, "DP": DP, "show": show});
    
    if (show) {
      let tr = document.createElement("tr");
      tr.style.color = color;
      
      let td = document.createElement("td");
      td.innerHTML = label;
      tr.appendChild(td);
      
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
    }
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
    if (!values["show"]) return;
    
    this.ctx.lineWidth = this.line_width;
    this.ctx.strokeStyle = values["color"];
    
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
    
    this.ctx.beginPath();
    this.ctx.globalAlpha = 1;
    this.ctx.arc(this.base_x + (this.TR + this.TE) / this.factor, this.base_y - this.T2(this.TE, values) * this.max_y, 4, 0, 2 * Math.PI);
    this.ctx.fillStyle = values["color"];
    this.ctx.fill();
  }
  
  
  draw_ui() {
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = "black";
    this.ctx.fillStyle = "black";
    this.ctx.globalAlpha = 1;
    
    this.ctx.setLineDash([5]);
    for (let j = 0; true; j++) {
      let x = this.base_x + this.TE/this.factor + j*this.TR/this.factor;
      
      if (x > this.base_x + this.max_x) break;
      
      this.ctx.beginPath();
      this.ctx.moveTo(x, this.base_y);
      this.ctx.lineTo(x, this.base_y-this.max_y);
      this.ctx.stroke();
    }
    
    this.ctx.setLineDash([]);
    for (let j = 0; true; j++) {
      let x = this.base_x + (j+1)*this.TR/this.factor;
      
      if (x > this.base_x + this.max_x) break;
      
      this.ctx.beginPath();
      this.ctx.moveTo(x, this.base_y);
      this.ctx.lineTo(x, this.base_y-this.max_y);
      this.ctx.stroke();
    }
    
    this.ctx.beginPath();
    this.ctx.moveTo(this.base_x, this.margin_top);
    this.ctx.lineTo(this.base_x, this.base_y);
    this.ctx.lineTo(this.canvas.width - this.margin_right, this.base_y);
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.moveTo(this.base_x - 1 - this.arrow_width/2, this.margin_top);
    this.ctx.lineTo(this.base_x - 1, this.margin_top - this.arrow_height);
    this.ctx.lineTo(this.base_x, this.margin_top - this.arrow_height);
    this.ctx.lineTo(this.base_x + this.arrow_width/2, this.margin_top);
    this.ctx.fill();
    
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width - this.margin_right, this.base_y - 1 - this.arrow_width/2);
    this.ctx.lineTo(this.canvas.width - this.margin_right + this.arrow_height, this.base_y - 1);
    this.ctx.lineTo(this.canvas.width - this.margin_right + this.arrow_height, this.base_y);
    this.ctx.lineTo(this.canvas.width - this.margin_right, this.base_y + this.arrow_width/2);
    this.ctx.fill();
  }
  
  
  color_svg() {
    let T2_values = [];
    for (let i = 0; i < this.values.length; i++) T2_values.push(this.T2(this.TE, this.values[i]));
    
    let min = Math.min(...T2_values);
    let max = Math.max(...T2_values);
    
    for (let i = 0; i < this.values.length; i++) {
      let value = Math.round(255 * (T2_values[i] - min) / (max - min));
      let color = `rgb(${value} ${value} ${value})`;
      
      for (let item of this.svg.getElementsByClassName(this.values[i]["class"])) item.style.fill = color;
    }
  }
  
  
  get_dragged_object(event) {
    let rect = this.canvas.getBoundingClientRect();
    let x = event.clientX - rect.left - this.base_x;
    
    let max_TR = Math.ceil(this.max_x * this.factor / this.TR);
    
    for (let i = 0; i < max_TR; i++) {
      if (Math.abs(x - ((this.TR * i + this.TE) / this.factor)) < 20) return ["TE", i];
      if (Math.abs(x - (this.TR * (i+1) / this.factor)) < 20) return ["TR", i];
    }
    
    return null;
  }
  
  
  refresh(event=null) {
    if (event && this.dragged_object) {
      let rect = this.canvas.getBoundingClientRect();
      let x = event.clientX - rect.left - this.base_x;
      
      let which, i;
      [which, i] = this.dragged_object;
      
      if (which == "TR") {
        this.TR = Math.round((x * this.factor) / (i+1));
        if (this.TR < this.TE + this.min_tr) this.TR = this.TE + this.min_tr;
      }
      else if (which == "TE") {
        this.TE = x * this.factor - this.TR * i;
        if (this.TE < this.min_te) this.TE = this.min_te;
        if (this.TE > this.TR - this.min_tr) this.TE = this.TR - this.min_tr;
      }
    }
    
    this.span_TR.innerHTML = this.TR;
    this.span_TE.innerHTML = this.TE;
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    for (let i = 0; i < this.values.length; i++) this.draw_curve(this.values[i]);
    this.draw_ui();
    this.color_svg();
  }
  
  
  refresh_cursor(event) {
    let dragged_object = this.get_dragged_object(event);
    
    if (dragged_object && !this.canvas.style.cursor) this.canvas.style.cursor = "w-resize";
    else if (!dragged_object && this.canvas.style.cursor) this.canvas.style.cursor = "";
  }
}


const se = new SpinEcho("canvas", "svg", "tr", "te", "table");

se.set_tissue("Eau", "water", "blue", 2400, 160, 1, true)
se.set_tissue("Graisse", "fat", "orange", 260, 80, 1, true)
se.set_tissue("Muscle", "muscle", "red", 870, 45, 0.75, false)
se.set_tissue("Substance grise", "gray_matter", "gray", 910, 100, 0.8, true)
se.set_tissue("Substance blanche", "white_matter", "lightgray", 680, 90, 0.7, true)

se.refresh();
