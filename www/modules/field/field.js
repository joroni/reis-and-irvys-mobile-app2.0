/**
 * Given a field name, this will return its field info.
 */
function drupalgap_field_info_field(field_name) {
  try {
    return drupalgap.field_info_fields[field_name];
  }
  catch (error) { drupalgap_error(error); }
}

/**
 * Returns info on all fields.
 */
function drupalgap_field_info_fields() {
  try {
    return drupalgap.field_info_fields;
  }
  catch (error) { drupalgap_error(error); }
}

/**
 * Given an entity type, field name, and bundle name this will return a JSON
 * object with data for the specified field name.
 */
function drupalgap_field_info_instance(entity_type, field_name, bundle_name) {
  try {
    var instances = drupalgap_field_info_instances(entity_type, bundle_name);
    return instances[field_name];
  }
  catch (error) { drupalgap_error(error); }
}

/**
 * Given an entity type and/or a bundle name, this returns the field info
 * instances for the entity or the bundle.
 */
function drupalgap_field_info_instances(entity_type, bundle_name) {
  try {
    var field_info_instances;
    if (!bundle_name) {
      field_info_instances = drupalgap.field_info_instances[entity_type];
    }
    else {
      if (typeof drupalgap.field_info_instances[entity_type] !== 'undefined') {
        field_info_instances = drupalgap.field_info_instances[entity_type][bundle_name];  
      }
    }
    return field_info_instances;
  }
  catch(error) { drupalgap_error(error); }
}

/**
 * Given an entity type, bundle name, form and entity, this will add the
 * entity's fields to the given form.
 */
function drupalgap_field_info_instances_add_to_form(entity_type, bundle_name, form, entity) {
  try {
    // Grab the field info instances for this entity type and bundle.
    var fields = drupalgap_field_info_instances(entity_type, bundle_name);
    // Use the default language, unless the entity has one specified.
    var language = drupalgap.settings.language;
    if (entity && entity.language) {
      language = entity.language;
    }
    // Iterate over each field in the entity and add it to the form. If there is
    // a value present in the entity, then set the field's form element default
    // value equal to the field value.
    if (fields) {
      $.each(fields, function(name, field){
        var field_info = drupalgap_field_info_field(name);
        if (field_info) {
          form.elements[name] = {
            'type':field_info.type,
            'title':field.label,
            'required':field.required,
            'description':field.description,
          };
          if (!form.elements[name][language]) { form.elements[name][language] = {}; }
          var default_value = field.default_value;
          var delta = 0;
          var cardinality = parseInt(field_info.cardinality);
          if (cardinality == -1) {
            cardinality = 1; // we'll just add one element for now, until we
                             // figure out how to handle the 'add another
                             // item' feature.
          }
          if (entity[name] && entity[name].length != 0) {
            for (var delta = 0; delta < cardinality; delta++) {
              if (entity[name][language][delta] && typeof entity[name][language][delta].value !== 'undefined') {
                default_value = entity[name][language][delta].value;
              }
              // If the default_value is null, set it to an empty string.
              if (default_value == null) { default_value = ""; }
              // TODO - It appears not all fields have a language code to use here,
              // for example taxonomy term reference fields don't!
              form.elements[name][language][delta] = {
                'value':default_value
              };
            }
          }
        }
      });
    }
  }
  catch (error) { drupalgap_error(error); }
}

/**
 * Given a field name, this will return the key that should be used when
 * setting its value on an entity. If the field name is not a field, it returns
 * false.
 */
function drupalgap_field_key(field_name) {
  try {
    // Determine the key to use for the value. By default, most fields
    // use 'value' as the key.
    var key = false;
    var field_info = drupalgap_field_info_field(field_name);
    if (field_info) {
      key = 'value';
      // Images use fid as the key.
      if (field_info.module == 'image' && field_info.type == 'image') {
        key = 'fid';
      }
      else if (field_info.module == 'taxonomy' && field_info.type == 'taxonomy_term_reference') {
        key = 'tid';
      }
    }
    return key;
  }
  catch (error) { drupalgap_error(error); }
}

/**
 * Implements hook_field_formatter_view().
 */
function number_field_formatter_view(entity_type, entity, field, instance, langcode, items, display) {
  try {
    var element = {};
    // If items is a string, convert it into a single item JSON object.
    if (typeof items === 'string') {
      items = {0:{value:items}}
    }
    if (!drupalgap_empty(items)) {
      $.each(items, function(delta, item){
          element[delta] = {
            markup:item.value
          };
      });
    }
    return element;
  }
  catch (error) { drupalgap_error(error); }
}

/**
 * Implements hook_field_data_string().
 */
function options_field_data_string(entity_type, bundle, entity, info, instance, langcode, delta, options) {
  try {
    var field_name = instance.field_name;
    var key = drupalgap_field_key(field_name);
    var value = entity[instance.field_name][langcode][delta][key];
    var data = '';
    if (value == '') { return data; }
    // Note, select does not work with [und][0][value] but works with
    // [und][value]. Otherwise, use the default data string.
    if (instance.widget.type == 'options_select') {
      data = entity_type + '[' + field_name + '][' + langcode + '][' + key + ']=' + encodeURIComponent(value);  
    }
    else {
      data = entity_type + '[' + field_name + '][' + langcode + '][' + delta + '][' + key + ']=' + encodeURIComponent(value);
    }
    return data;
  }
  catch (error) { drupalgap_error(error); }
}

/**
 * Implements hook_field_widget_form().
 */
function options_field_widget_form(form, form_state, field, instance, langcode, items, delta, element) {
  try {
    switch (element.type) {
      case 'checkbox':
        // If the checkbox has a default value of 1, check the box.
        if (items[delta].default_value == 1) { items[delta].checked = true; }
        break;
      case 'radios':
        break;
      case 'select':
        // If the select list is required, add a 'Select' option and set it as
        // the default.
        if (items[delta].required) {
          items[delta].options[-1] = 'Select';
          items[delta].value = -1;
        }
        break;
      case 'taxonomy_term_reference':
          // Change the item type to a hidden input.
          items[delta].type = 'hidden';
          // What vocabulary are we using?
          var machine_name = field.settings.allowed_values[0].vocabulary;
          var taxonomy_vocabulary = taxonomy_vocabulary_machine_name_load(machine_name);
          
          var widget_type = false;
          if (instance.widget.type == 'options_select') { widget_type = 'select'; }
          else {
            console.log('WARNING: options_field_widget_form() - ' + instance.widget.type + ' not yet supported for ' + element.type + ' form elements!');
            return false;
          }
          var widget_id = items[delta].id + '-' + widget_type;
          items[delta].children.push({
              type:widget_type,
              attributes:{
                id:widget_id,
                onchange:"_theme_taxonomy_term_reference_onchange(this, '" + items[delta].id + "');"
              }
          });
          // Attach a pageshow handler to the current page that will load the terms
          // into the widget.
          var options = {
            'page_id':drupalgap_get_page_id(drupalgap_path_get()),
            'jqm_page_event':'pageshow',                    
            'jqm_page_event_callback':'_theme_taxonomy_term_reference_load_items',
            'jqm_page_event_args':JSON.stringify({
                'taxonomy_vocabulary':taxonomy_vocabulary,
                'widget_id':widget_id
            })
          };
          items[delta].children.push({markup:drupalgap_jqm_page_event_script_code(options)});
        break;
    }
  }
  catch (error) { drupalgap_error(error); }
}

/**
 * Implements hook_field_formatter_view().
 */
function text_field_formatter_view(entity_type, entity, field, instance, langcode, items, display) {
  try {
    var element = {};
    if (!drupalgap_empty(items)) {
      $.each(items, function(delta, item){
          element[delta] = {
            markup:item.value
          };
      });
    }
    return element;
  }
  catch (error) { drupalgap_error(error); }
}

/**
 * Implements hook_field_widget_form().
 */
function text_field_widget_form(form, form_state, field, instance, langcode, items, delta, element) {
  try {
    // Determine the widget type, then set the delta item's type property.
    var type = null;
    switch (element.type) {
      case "text":
        type = 'textfield';
        break;
      case 'textarea':
      case 'text_long':
      case "text_with_summary":
      case 'text_textarea':
        type = 'textarea';
    }
    items[delta].type = type;
  }
  catch (error) { drupalgap_error(error); }
}

