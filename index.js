import * as d3 from "d3";

export default class Lineview {
    constructor(params){
        // default params
        this.container_id = "#lineview_container";

        this.svg_width = 1000;
        this.svg_height = 200;
        this.svg_background = "#f0f0f0";

        this.axis_left = 25;
        this.axis_top = 15;
        this.axis_ymin = -1.75;
        this.axis_ymax = 2;
        this.axis_tickvalues = [-1.5, -1, -0.5, 0, 0.5, 1, 1.5];

        this.rawdata = [];
        this.cbsdata = [];
        this.zoomdata = [],
        this.cs = null;
        this.csMin = null;
        this.ce = null;
        this.ceMax = null;
        this.threshold_upper = 0.35;
        this.threshold_lower = -0.35;
        this.color_upper = "blue";
        this.color_lower = "red";
        this.color_middle = "black";
        this.height_normal = 2;
        this.height_lower = 3;
        this.height_upper = 3;
        this.cbs_opacity = 0.25;
        this.zoom_opacity_outer = 0.25;
        this.zoom_opacity_inner = 0.50;

        this.show_axis_x = true;
        this.show_axis_y = true;
        this.show_rawdata = true;
        this.show_cbsdata = false;
        this.show_cbsdata_fill = true;
        this.show_zoomdata = true;

        this.cursor_style_idle = 'grab';
        this.cursor_style_grabbing = 'grabbing';
        this.zoom_factor = 1.25;

        this.last_action = "init";


        // params given by user overwrite default
        this.update_params(params);


        // draw svg and iniate empty groups
        this.draw_svg();
        this.init_svg_groups();
        

        // render
        this.render();

        // add interactive functionality
        this.add_dragging_functionality();
        this.add_zooming_functionality();
    };

    get window(){
        return this.ce-this.cs;
    }


    get message(){
        return {
            "container_id": this.container_id,
            "svg_width": this.svg_width,
            "svg_height": this.svg_height,
            "svg_background": this.svg_background,
            "axis_left": this.axis_left,
            "axis_top": this.axis_top,
            "axis_ymin": this.axis_ymin,
            "axis_ymax": this.axis_ymax,
            "axis_tickvalues": this.axis_tickvalues,
            "rawdata": this.rawdata,
            "cbsdata": this.cbsdata,
            "zoomdata": this.zoomdata,
            "cs": this.cs,
            "csMin": this.csMin,
            "ce": this.ce,
            "ceMax": this.ceMax,
            "threshold_upper": this.threshold_upper,
            "threshold_lower": this.threshold_lower,
            "color_upper": this.color_upper,
            "color_lower": this.color_lower,
            "color_middle": this.color_middle,
            "height_normal": this.height_normal,
            "height_lower": this.height_lower,
            "height_upper": this.height_upper,
            "cbs_opacity": this.cbs_opacity,
            "zoom_opacity_outer": this.zoom_opacity_outer,
            "zoom_opacity_inner": this.zoom_opacity_inner,
            "show_axis_x": this.show_axis_x,
            "show_axis_y": this.show_axis_y,
            "show_rawdata": this.show_rawdata,
            "show_cbsdata": this.show_cbsdata,
            "show_cbsdata_fill": this.show_cbsdata_fill,
            "show_zoomdata": this.show_zoomdata,
            "cursor_style_idle": this.cursor_style_idle,
            "cursor_style_grabbing": this.cursor_style_grabbing,
            "zoom_factor": this.zoom_factor,
            "last_action": this.last_action
        }
    }

    update(params){
        this.remove_all_groups();
        this.update_params(params);
        this.render();
    }

    update_params(params){
        for (let key in params) {
            this[key] = params[key]
        };
    }

    dispatch_update(){
        d3.select(this.container_id).dispatch("update", {'detail':this.message});
    }
    
    remove_all_groups(){
        this.remove_axis_x();
        this.remove_axis_y();
        this.remove_rawdata();
        this.remove_cbsdata();
        this.remove_cbsdata_fill();
        this.remove_zoomdata();
        this.remove_clip();
    }

    render(){
        this.svg.attr("width", this.svg_width);
        this.draw_clip();
        if (this.show_axis_y) {
            this.draw_axis_y();
        }
        if (this.show_axis_x) {
            this.draw_axis_x();
        }
        if (this.show_rawdata) {
            this.draw_rawdata();
        }
        if (this.show_cbsdata) {
            this.draw_cbsdata();
        }
        if (this.show_cbsdata_fill) {
            this.draw_cbsdata_fill();
        }
        if (this.show_zoomdata) {
            this.draw_zoomdata();
        }
    }

    remove_all_groups(){
        this.remove_axis_x();
        this.remove_axis_y();
        this.remove_rawdata();
        this.remove_cbsdata();
        this.remove_cbsdata_fill();
        this.remove_zoomdata();
        this.remove_clip();
    }

    init_svg_groups(){
        this.clip_group = this.svg.append("g").attr("id", "clip_group");
        this.axis_y_group = this.svg.append("g").attr("id", "axis_y_group");
        this.axis_x_group = this.svg.append("g").attr("id", "axis_x_group");
        this.rawdata_group = this.svg.append("g").attr("id", "rawdata_group");
        this.cbsdata_group = this.svg.append("g").attr("id", "cbsdata_group");
        this.cbsdata_group_fill = this.svg.append("g").attr("id", "cbsdata_group_fill");
        this.zoomdata_group = this.svg.append("g").attr("id", "zoomdata_group");
    }

    get scale_y(){
        return d3.scaleLinear()
            .domain([this.axis_ymin, this.axis_ymax])
            .range([this.svg_height, 0])
            ;
    }

    get scale_x(){
        return d3.scaleLinear()
            .domain([this.cs, this.ce])
            .range([0, this.svg_width-this.axis_left])
            ;
    }

    determine_color(value){
        if (value >= this.threshold_upper) {
            return this.color_upper;
        } else if (value <= this.threshold_lower) {
            return this.color_lower;
        } else {
            return this.color_middle;
        }
    }

    determine_height(value){
        if (value >= this.threshold_upper) {
            return this.height_upper;
        } else if (value <= this.threshold_lower) {
            return this.height_lower;
        } else {
            return this.height_normal;
        }
    }

    draw_svg(){
        this.svg = d3.select(this.container_id).append('svg');
        this.svg
            .attr("width", this.svg_width)
            .attr("height", this.svg_height)
            .style("background", this.svg_background)
            .style('cursor', this.cursor_style_idle);
            ;
    }

    draw_axis_y(){
        this.axis_y_group
            .attr('transform', `translate(${this.svg_width + 1}, 0)`)
            .call(
                d3.axisLeft(this.scale_y)
                    .tickSizeInner(this.svg_width - this.axis_left)
                    .tickValues(this.axis_tickvalues)
            )
            ;
    }

    draw_axis_x(){
        this.axis_x_group
            .attr('transform', `translate(${this.axis_left}, ${this.svg_height})`)
            .call(
                d3.axisTop(this.scale_x)
                    .tickSizeInner(this.svg_height - this.axis_top)
                    //.tickValues(this.axis_tickvalues)
            )
            ;
    }

    draw_clip(){
        this.clip_group
            .append("clipPath")
                .attr("id", "clip_path")
                .append("rect")
                .attr("x", 0)
                .attr("y", this.axis_top)
                .attr("width", this.svg_width - this.axis_left)
                .attr("height", this.svg_height - this.axis_top)
                ;
    }

    draw_rawdata(){
        this.rawdata_group
            .attr('transform', `translate(${this.axis_left}, 0)`)
            .attr('clip-path', 'url(#clip_path)')
            .selectAll("rect_rawdata")
                .data(this.rawdata)
                .enter()
                .append("rect")
                    .attr("x", d => this.scale_x(d.cs))
                    .attr("y", d => this.scale_y(d.r))
                    .attr('width', d => d3.max([this.scale_x(d.ce) - this.scale_x(d.cs),1]))
                    .attr('height', d => this.determine_height(d.r))
                    .attr("fill", d => this.determine_color(d.r))
                    ;
    }

    draw_cbsdata(){
        this.cbsdata_group
            .attr('transform', `translate(${this.axis_left}, 0)`)
            .attr('clip-path', 'url(#clip_path)')
            .selectAll("rect_cbsdata")
                .data(this.cbsdata)
                .enter()
                .append("rect")
                .attr("x", d => this.scale_x(d.cs))
                .attr("y", d => this.scale_y(d.r.max))
                .attr('width', d => d3.max([this.scale_x(d.ce) - this.scale_x(d.cs),1]))
                .attr('height', d => this.scale_y(d.r.min)-this.scale_y(d.r.max))
                .attr("fill", d => this.determine_color(d.r.mean))
                .style("opacity", this.cbs_opacity)
                ;
    }

    draw_cbsdata_fill(){
        this.cbsdata_group_fill
            .attr('transform', `translate(${this.axis_left}, 0)`)
            .attr('clip-path', 'url(#clip_path)')
            .selectAll("rect_cbsdata_fill")
                .data(this.cbsdata)
                .enter()
                .append("rect")
                .attr("x", d => this.scale_x(d.cs))
                .attr("y", this.scale_y.range()[1])
                .attr('width', d => d3.max([this.scale_x(d.ce) - this.scale_x(d.cs),1]))
                .attr('height', d => this.scale_y.range()[0]-this.scale_y.range()[1])
                .attr("fill", d => this.determine_color(d.r.mean))
                .style("opacity", this.cbs_opacity)
                ;
    }

    draw_zoomdata(){
        this.zoomdata_group.attr('clip-path', 'url(#clip_path)');
        this.zoomdata_group
            .attr('transform', `translate(${this.axis_left}, 0)`)
            .selectAll("rect_zoomdata_max_p75")
                .data(this.zoomdata)
                .enter()
                .append("rect")
                .attr("x", d => this.scale_x(d.cs))
                .attr("y", d => this.scale_y(d.r.max))
                .attr('width', d => d3.max([this.scale_x(d.ce) - this.scale_x(d.cs),1]))
                .attr('height', d => this.scale_y(d.r.p75)-this.scale_y(d.r.max))
                .attr("fill", d => this.determine_color(d.r.max))
                .style("opacity", this.zoom_opacity_outer)
                ;
        this.zoomdata_group
            .attr('transform', `translate(${this.axis_left}, 0)`)
            .selectAll("rect_zoomdata_p75_med")
                .data(this.zoomdata)
                .enter()
                .append("rect")
                .attr("x", d => this.scale_x(d.cs))
                .attr("y", d => this.scale_y(d.r.p75))
                .attr('width', d => d3.max([this.scale_x(d.ce) - this.scale_x(d.cs),1]))
                .attr('height', d => this.scale_y(d.r.med)-this.scale_y(d.r.p75))
                .attr("fill", d => this.determine_color(d.r.p75))
                .style("opacity", this.zoom_opacity_inner)
                ;
        this.zoomdata_group
            .attr('transform', `translate(${this.axis_left}, 0)`)
            .selectAll("rect_zoomdata_med_p25")
                .data(this.zoomdata)
                .enter()
                .append("rect")
                .attr("x", d => this.scale_x(d.cs))
                .attr("y", d => this.scale_y(d.r.med))
                .attr('width', d => d3.max([this.scale_x(d.ce) - this.scale_x(d.cs),1]))
                .attr('height', d => this.scale_y(d.r.p25)-this.scale_y(d.r.med))
                .attr("fill", d => this.determine_color(d.r.p25))
                .style("opacity", this.zoom_opacity_inner)
                ;
        this.zoomdata_group
            .attr('transform', `translate(${this.axis_left}, 0)`)
            .selectAll("rect_zoomdata_p25_min")
                .data(this.zoomdata)
                .enter()
                .append("rect")
                .attr("x", d => this.scale_x(d.cs))
                .attr("y", d => this.scale_y(d.r.p25))
                .attr('width', d => d3.max([this.scale_x(d.ce) - this.scale_x(d.cs),1]))
                .attr('height', d => this.scale_y(d.r.min)-this.scale_y(d.r.p25))
                .attr("fill", d => this.determine_color(d.r.p25))
                .style("opacity", this.zoom_opacity_outer)
                ;
    }

    remove_svg(){
        this.svg.remove();
    }

    remove_axis_y(){
        this.axis_y_group.selectAll("*").remove();
    }

    remove_axis_x(){
        this.axis_x_group.selectAll("*").remove();
    }

    remove_clip(){
        this.clip_group.selectAll("*").remove();
    }

    remove_rawdata(){
        this.rawdata_group.selectAll("*").remove();
    }

    remove_cbsdata(){
        this.cbsdata_group.selectAll("*").remove();
    }

    remove_cbsdata_fill(){
        this.cbsdata_group_fill.selectAll("*").remove();
    }

    remove_zoomdata(){
        this.zoomdata_group.selectAll("*").remove();
    }

    add_dragging_functionality(){
        let thisModule = this;
        
        this.svg.on("mousedown", function(e1){

            thisModule.last_action = "drag.start";

            let x_start = e1.x;
            let scale = thisModule.scale_x;
            let cs_start = thisModule.cs;
            let ce_start = thisModule.ce;

            thisModule.dispatch_update();

            thisModule.svg.on("mousemove", function(e2){

                thisModule.last_action = "drag";

                thisModule.svg.style('cursor', thisModule.cursor_style_grabbing);
                let dc = - scale.invert(e2.x) + scale.invert(x_start);
                
                var newCs = cs_start + dc;
                var newCe = ce_start + dc;

                if (newCs < thisModule.csMin){
                    thisModule.cs = thisModule.csMin;
                    thisModule.ce = thisModule.csMin + thisModule.window;
                }
                else if (newCe > thisModule.ceMax){
                    thisModule.cs = thisModule.ceMax - thisModule.window;
                    thisModule.ce = thisModule.ceMax;
                }
                else{
                    thisModule.cs = newCs;
                    thisModule.ce = newCe;
                }

                thisModule.dispatch_update();

                thisModule.svg.on("mouseup", function(){

                    thisModule.last_action = "drag.end";

                    thisModule.svg
                        .on('mousemove', null)
                        .on('mouseup', null)
                        ;
                    thisModule.svg.style('cursor', thisModule.cursor_style_idle);

                    thisModule.dispatch_update();
                })
            })
        });
    }

    add_zooming_functionality(){
        let thisModule = this;
        this.svg.on('wheel',function(e){

            thisModule.last_action = "zoom";

            let window = thisModule.ce - thisModule.cs;
            let new_window = window;
            if (e.wheelDeltaY < 0){
                new_window = new_window*thisModule.zoom_factor;
            } 
            else if (e.wheelDeltaY > 0){
                new_window = new_window/thisModule.zoom_factor;
            }
            let dc = (new_window - window)/2;

            thisModule.cs = d3.max([
                thisModule.cs - dc,
                thisModule.csMin
            ]);
            thisModule.ce = d3.min([
                thisModule.ce + dc,
                thisModule.ceMax
            ])            
            thisModule.dispatch_update();
        });
    }
}

