import { get, computed } from "@ember/object";

export default function(template) {
  var dependentKeys = template.match(/{{([^}]*)}}/g).map(function(key) {
    return key.replace(/{{(.*)}}/, "$1");
  });
  return computed(...dependentKeys, {
    get() {
      return dependentKeys.reduce((result, key) => {
        let value = get(this, key);
        if (value == null || result == null) {
          return null;
        }
        return template.replace(`{{${key}}}`, value);
      }, template);
    }
  });
}
