// Generated by CoffeeScript 1.6.3
(function() {
  var Dialogs, Domain, Editor, Parser, Port, Router, Vespa, Views, models, objects, templates, vespa, views;

  window.Models = {};

  Views = {};

  Dialogs = {};

  objects = {};

  models = {};

  views = {};

  templates = {};

  vespa = null;

  $(document).ready(function() {
    var flip;
    flip = true;
    $('#expand').on('click', function() {
      return $('#status_pane').animate({
        height: flip ? "+=8em" : "-=8em"
      }, 200, function() {
        return flip = !flip;
      });
    });
    templates = {
      editor: $('#tmpl_editor').text()
    };
    if (vespa == null) {
      vespa = new Vespa();
    }
  });

  Vespa = (function() {
    function Vespa() {
      vespa = this;
      this.avispa = new Avispa({
        el: $('#surface svg')
      });
      $('#surface').append(this.avispa.$el);
      models.nodes = new Models.Nodes;
      models.positions = new Models.Positions;
      models.links = new Models.Links;
      models.tasks = new Models.Tasks;
      this.dispatch = _.clone(Backbone.Events);
      this.dispatch.on('CreateDomain', this.OnCreateDomain, this);
      this.dispatch.on('UpdateDomain', this.OnUpdateDomain, this);
      this.dispatch.on('DeleteDomain', this.OnDeleteDomain, this);
      this.dispatch.on('CreatePort', this.OnCreatePort, this);
      this.dispatch.on('UpdatePort', this.OnUpdatePort, this);
      this.dispatch.on('DeletePort', this.OnDeletePort, this);
      this.dispatch.on('CreateLink', this.OnCreateLink, this);
      this.dispatch.on('UpdateLink', this.OnUpdateLink, this);
      this.dispatch.on('DeleteLink', this.OnDeleteLink, this);
      this.dispatch.on('UpdatePosition', this.OnUpdatePosition, this);
      this.dispatch.on('UpdateArc', this.OnUpdateArc, this);
      this.connectionAttempts = 0;
      this.ConnectWS('lobster');
      new Router();
      Backbone.history.start();
      return this;
    }

    Vespa.prototype.OnCreateDomain = function(id, parent, obj) {
      var domain;
      domain = new Domain({
        _id: id,
        parent: parent,
        name: obj.name,
        position: obj.coords
      });
      objects[id] = domain;
      vespa.avispa.$groups.append(domain.$el);
    };

    Vespa.prototype.OnCreatePort = function(id, parent, obj) {
      var port;
      port = new Port({
        _id: id,
        parent: parent,
        label: id,
        position: obj.coords
      });
      objects[id] = port;
      vespa.avispa.$objects.append(port.$el);
    };

    Vespa.prototype.OnCreateLink = function(dir, left, right) {
      var link;
      link = new Avispa.Link({
        direction: dir,
        left: left,
        right: right
      });
      vespa.avispa.$links.append(link.$el);
    };

    Vespa.prototype.ConnectWS = function(channel) {
      var error, host,
        _this = this;
      this.timeout = Math.min(this.timeout + 1, 30);
      try {
        host = "ws://" + location.host + "/ws/" + channel;
        this.ws = new WebSocket(host);
        this.timeout = 0;
      } catch (_error) {
        error = _error;
        console.log('Connection failed');
        return;
      }
      this.ws.onmessage = function(event) {
        var msg;
        msg = JSON.parse(event.data);
        _this.dispatch.trigger(msg.action, msg);
      };
      this.ws.onclose = function(event) {
        setTimeout(function() {
          return _this.ConnectWS(channel);
        }, 1000 * _this.timeout);
      };
    };

    return Vespa;

  })();

  Models.Node = Backbone.DeepModel.extend({
    idAttribute: '_id',
    urlRoot: '/data/nodes/'
  });

  Models.Nodes = Backbone.Collection.extend({
    model: Models.Node
  });

  Models.Controller = Backbone.DeepModel.extend({
    idAttribute: '_id',
    urlRoot: '/data/controllers/'
  });

  Models.Controllers = Backbone.Collection.extend({
    model: Models.Controller
  });

  Models.Link = Backbone.DeepModel.extend({
    idAttribute: '_id',
    urlRoot: '/data/links/'
  });

  Models.Links = Backbone.Collection.extend({
    model: Models.Link
  });

  Models.Task = Backbone.DeepModel.extend({
    idAttribute: '_id',
    urlRoot: '/data/tasks/'
  });

  Models.Tasks = Backbone.Collection.extend({
    model: Models.Task,
    url: '/data/tasks/'
  });

  Models.Response = Backbone.DeepModel.extend({
    idAttribute: '_id',
    urlRoot: '/data/response/'
  });

  Models.Responses = Backbone.DeepModel.extend({
    idAttribute: '_id',
    urlRoot: '/data/responses/'
  });

  Models.Position = Backbone.Model.extend({
    idAttribute: '_id',
    urlRoot: '/data/position/'
  });

  Models.Positions = Backbone.Collection.extend({
    model: Models.Position
  });

  Router = Backbone.Router.extend({
    routes: {
      'editor': 'editor',
      'node': 'node',
      'load/:example': 'load',
      'logout': 'logout',
      '': 'main'
    },
    initialize: function() {
      this.modal = $('#modal');
      this.editor = null;
    },
    cleanse: function() {},
    main: function() {
      return this.cleanse();
    },
    editor: function() {
      return $('#editor-container').toggle();
    },
    load: function(example) {
      $.ajax({
        url: "/static/data/" + example + ".lsr.json",
        success: function(lsr) {
          return Parser.Load(lsr);
        }
      });
    },
    node: function() {},
    logout: function() {
      return window.location = '/logout';
    }
  });

  Parser = {
    Load: function(lsr) {
      this.parent = [null];
      this.Domain(lsr);
    },
    Domain: function(domain) {
      var bounds, connection, domains, id, idx, port, subdomain, _ref, _ref1, _ref2;
      domains = {
        x: 10
      };
      bounds = {
        x: 40,
        y: 40
      };
      _ref = domain.subdomains;
      for (id in _ref) {
        subdomain = _ref[id];
        subdomain.coords = {
          x: domains.x,
          y: 100,
          w: 220 * Object.keys(subdomain.subdomains).length || 200,
          h: 220 * Object.keys(subdomain.subdomains).length || 200
        };
        vespa.dispatch.trigger('CreateDomain', subdomain.name, this.parent[0], subdomain);
        this.parent.unshift(objects[subdomain.name]);
        this.Domain(subdomain);
        this.parent.shift();
        domains.x += 210;
      }
      _ref1 = domain.ports;
      for (id in _ref1) {
        port = _ref1[id];
        port.coords = {
          x: bounds.x,
          y: bounds.y,
          radius: 30,
          fill: '#eeeeec'
        };
        vespa.dispatch.trigger('CreatePort', id, this.parent[0], port);
        bounds.x += 70;
      }
      _ref2 = domain.connections;
      for (idx in _ref2) {
        connection = _ref2[idx];
        vespa.dispatch.trigger('CreateLink', connection.connection, objects[connection.left.port], objects[connection.right.port]);
      }
    }
  };

  Domain = Avispa.Group.extend({
    init: function() {
      this.$label = $SVG('text').attr('dx', '0.5em').attr('dy', '1.5em').text(this.options.name).appendTo(this.$el);
      return this;
    },
    render: function() {
      this.$rect.attr('x', this.position.get('x')).attr('y', this.position.get('y'));
      this.$label.attr('x', this.position.get('x')).attr('y', this.position.get('y'));
      return this;
    }
  });

  Port = Avispa.Node;

  Editor = Backbone.View.extend({
    id: 'editor',
    className: 'dialog',
    initialize: function() {
      this.$el.attr('title', 'Editor').html('<textarea resizable="0"></textarea>').dialog({
        resizable: true,
        width: 400,
        minWidth: 400,
        height: 400,
        minHeight: 400,
        modal: false,
        hide: {
          effect: 'fade',
          duration: 200
        },
        buttons: {
          'Update': function() {
            return $(this).dialog("close");
          },
          'Cancel': function() {
            return $(this).dialog("close");
          }
        }
      });
      return this;
    }
  });

}).call(this);
