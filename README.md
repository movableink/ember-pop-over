# ember {{popup-menu}}

This popup-menu provides a pluggable interface for dealing with popups around your site. It has an inteface for registering constraint behaviors and animations.

For use of the popup-menu as a tooltip, the following handlebars will do the trick:

```handlebars
<span id="help-me" class="icon-help"></span>
{{#popup-menu for="help-me" on="hover"}}
  Hey there!
{{/popup-menu}}
```

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
