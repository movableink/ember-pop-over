# ember {{popup-menu}}

This popup-menu provides a pluggable interface for dealing with popups around your site. It has an inteface for registering constraint behaviors and animations.

For use of the popup-menu as a tooltip, the following handlebars will do the trick:

```handlebars
<span id="help-me" class="icon-help"></span>
{{#popup-menu for="help-me" on="hover"}}
  Hey there!
{{/popup-menu}}
```

## Recipes

Tooltips:
```javascript
import PopupMenu from "ember-popup-menu/components/popup";

var ToolTip = PopupMenu.extend({
  classNames: ['tool-tip'],
  layoutName: 'components/popup-menu',
  on: ['hover', 'focus'],
  flow: 'popup'
});

export default ToolTip;
```

```handlebars
<span id="help-me" class="icon-help"></span>
{{#tool-tip for="help-me"}}
  Hey there!
{{/tool-tip}}
```

Dropdown menu:
```javascript
import PopupMenu from "ember-popup-menu/components/popup";

var DropDown = PopupMenu.extend({
  classNames: ['drop-down'],
  layoutName: 'components/popup-menu',
  on: ['hover', 'focus', 'hold'],
  flow: 'dropdown'
});

export default DropDown;
```

```handlebars
<div id="current-user">Me</div>
{{#drop-down for="current-user"}}
  <ul>
    <li>Settings</li>
    <li>Billing</li>
  </ul>
{{/drop-down}}
```

## Writing your own components using {{popup-menu}}

The {{popup-menu}} component is designed to be used with other components. It provides a programatic API for adding customized targets, and a set of utilities that allow for an easier and more consistent development experience when authoring these addons.

Let's go through the steps of authoring a component that uses a {{popup-menu}} by making a {{date-picker}} widget. Some of the implementation details will be ignored to make this tutorial clearer to follow.

First, let's bootstrap the addon:

```bash
$ ember addon my-date-picker
```

After this we'll add `ember-popup-menu` and `ember-moment` as a dependencies (*not* a development dependency):

```bash
$ cd my-date-picker
$ npm install --save ember-popup-menu
$ npm install --save ember-moment
```

Now, we're ready to start authoring the addon. Let's first start by creating the component javascript file.

```bash
$ mkdir addon/components
$ touch addon/components/date-picker.js
```

Using the editor of your choice, add the following bootstrap code to get started:

```javascript
import Ember from "ember";

var DatePicker = Ember.Component.extend({

});

export DatePicker;
```

Let's define our public API first. This is what you will use to interface with the component in handlebars:

```javascript
import Ember from "ember";

var DatePicker = Ember.Component.extend({
  value: null,
  icon: null
});

export DatePicker;
```

`value` is the date that is picked and `icon` is an icon used to display a calendar icon.

We're going to make the date picker a combination of a text field and a configurable icon, so let's start hooking them up so the popup-menu knows what will trigger events:

```javascript
import Ember from "ember";
import nearestChild from "ember-popup-menu/computed/nearest-child";

var next = Ember.run.next;

var get = Ember.get;

var DatePicker = Ember.Component.extend({
  value: null,
  icon: null,
  
  popup: nearestChild('popup-menu'),
  
  attachTargets: function () {
    next(this, function () {
      var popup = get(this, 'popup');
      var icon = get(this, 'icon');

      popup.addTarget(icon, {
        on: "click"  
      });
    });
  }.on('didInsertElement')
});

export DatePicker;
```

Let's walk through the code.

First, we imported `nearestChild`. This is a computed property that returns the nearest child of a given type. We then use this property to get the popup-menu.

Then we add the icon as a target for the popup menu that will toggle the menu when clicked. We do this on the next run loop to ensure that all the views have been appended to the DOM. If we don't do this, then there is the potential that the target is never properly attached.


## Installation

* `npm install --save-dev ember-popup-menu`
* `ember g ember-popup-menu`

## Running

* `ember server`
* Visit your app at http://localhost:4200.

## Running Tests

* `ember test`
* `ember test --server`

## Building

* `ember build`

For more information on using ember-cli, visit [http://www.ember-cli.com/](http://www.ember-cli.com/).
