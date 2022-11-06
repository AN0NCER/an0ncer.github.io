const episodes = {
  selected: "",
  add: function(i=1){
    const html =`<span class="episode" data-index="${i}">${i}<span class="ep-name">EP</span></span>`;
    $('.episodes > .value').append(html);
    $(`.episode[data-index="${i}"]`).on('click', function(h,e){
      if(episodes.events.click){
        let index = $(h.currentTarget).data('index');
        episodes.events.click.forEach(event => event(h,index));
        episodes.select(index);
      }
    });
    if(this.events.adds){
      this.events.adds.forEach(event => event(i));
    }
  },
  select: function(i=1, e, u){
    const element = $('.episodes > .value > .episode')[(i-1)];
    if(!element){
      return;
    }
    if(this.selected){
      anime({targets:this.selected,color:"#555657",easing: 'easeOutElastic(1, 1)'});
    }
    this.selected = element;
    const left = $(element).position().left;
    anime({
      targets: '.sel',
      left: left,
      complete: function(anim){if(e){e();}},
      update: function(anim) {if(u){u(anim);}},
      easing: 'easeOutElastic(1, 1)'
    });
    anime({
      targets: element,
      color: "#020202",
      easing: 'easeOutElastic(1, 1)'
    })
    this.events.changeselect.forEach(event => event(i));
  },
  events: {
      changeselect: [],
    onchangeselect: function(e){
      this.changeselect.push(e);
    },
        adds: [],
    onadded: function(e){
      this.adds.push(e);
    },
    click: [],
    onclicked: function(e){
      this.click.push(e);
    },
  }
}