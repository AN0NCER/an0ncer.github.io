const dubbing = {

  list_enabled: false,
  
  dub:{
      name: 'DUB',
      list:{},
      example: {
          id: 0,
          title: '',
          episodes_count: 0,
          last_episode: 0,
          link: ''
      },
      enable: true,
      length: 0,
      select_id: 0,

      Add: function(data = this.example){
          this.list[data.id] = data;
          $('.dub-suluction-dub').append(`<div class="val" data-id="${data.id}">${data.title}</div>`);
          $('.dub-suluction-dub > .val[data-id="'+data.id+'"]').click(()=>this.onclick(this.list[data.id]));
          this.length += 1;
          dubbing.events.addcount(this);
          this.AddPopular(data.id);
          // console.log(this.list[data.id]);
          // delete this.list[data.id];
          // console.log(this.list);
      },

      Select: function(id = 0){
          if(this.list[id]){
              this.select_id = id;
              $('.select-dub > span').text(this.list[id].title);
              return this.list[id];
          }
      },

      Get: function(id = this.select_id){
          if(this.list[id]){
              return this.list[id];
          }
      },

      onclick: function(data){
          if(data){
              this.Select(data.id);
              dubbing.Hide();
          }
      },

      AddPopular: function(id){
          if(this.length < 5){
              $('.more-dub-select').append(`<div class="val" data-id="${this.list[id].id}">${this.list[id].title}</div>`);
              $('.more-dub-select > .val[data-id="'+id+'"]').click(()=>this.onclick(this.list[id]));
          }
      }
  },

  sub: {
      name: 'SUB',
      list:{},
      example: {
          id: 0,
          title: '',
          episodes_count: 0,
          last_episode: 0,
          link: ''
      },
      enable: false,
      length: 0,
      select_id: 0,

      Add: function(data = this.example){
          this.list[data.id] = data;
          $('.dub-suluction-sub').append(`<div class="val" data-id="${data.id}">${data.title}</div>`);
          $('.dub-suluction-sub > .val[data-id="'+data.id+'"]').click(()=>this.onclick(this.list[data.id]));
          this.length += 1;
          dubbing.events.addcount(this);
          this.AddPopular(data.id);
      },

      AddPopular: function(id){
          if(this.length < 5){
              $('.more-sub-select').append(`<div class="val" data-id="${this.list[id].id}">${this.list[id].title}</div>`);
              $('.more-sub-select > .val[data-id="'+id+'"]').click(()=>this.onclick(this.list[id]));
          }
      },

      Select: function(id = 0){
          if(this.list[id]){
              this.select_id = id;
              $('.select-sub > span').text(this.list[id].title);
              return this.list[id];
          }
      },

      Get: function(id = this.select_id){
          if(this.list[id]){
              return this.list[id];
          }
      },

      onclick: function(data){
          if(data){
              this.Select(data.id);
              dubbing.Hide();
          }
      },
  },

  events:{
      addcount: function(object){
          if(object){
              if(object.name && object.name == 'DUB'){
                  $('.dub-count').text(object.length);
              }else if(object.name && object.name == 'SUB'){
                  $('.sub-count').text(object.length);
              }
          }
      }
  },

  Show: function(){
      let c = 'dub-selection-hide';
      if(this.dub.enable){
          if(!this.list_enabled){
              $('.dub-suluction-dub').removeClass(c);
          }else{
              $('.dub-suluction-dub').addClass(c);
          }
          this.list_enabled = !this.list_enabled;
      }else if(this.sub.enable){
          if(!this.list_enabled){
              $('.dub-suluction-sub').removeClass(c);
          }else{
              $('.dub-suluction-sub').addClass(c);
          }
          this.list_enabled = !this.list_enabled;
      }
  },

  Hide: function(){
      if(this.list_enabled){
          this.Show();
      }
  },
  
  Change: function(name){
      if(this.list_enabled){
          this.Show();
      }
      if(name == 'DUB' && this.dub.enable == false){
          $('.sub-selection').removeClass('dub-sel-selected');
          $('.dub-selection').addClass('dub-sel-selected');
          $('.content-selection-dub').removeClass('content-dub-hide');
          $('.content-selection-sub').addClass('content-dub-hide');
          this.dub.enable = true;
          this.sub.enable = false;
      }else if(name == 'SUB' && this.sub.enable == false){
          $('.dub-selection').removeClass('dub-sel-selected');
          $('.sub-selection').addClass('dub-sel-selected');
          $('.content-selection-dub').addClass('content-dub-hide');
          $('.content-selection-sub').removeClass('content-dub-hide');
          this.dub.enable = false;
          this.sub.enable = true;
      }
  }
}

$('.select-dub').click(()=>{
  dubbing.Show();
});
$('.select-sub').click(()=>{
  dubbing.Show();
})

$('.sub-selection').click(()=>{
  dubbing.Change('SUB');
});
$('.dub-selection').click(()=>{
  dubbing.Change('DUB');
});