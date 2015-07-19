#include <pebble.h>

static Window* window;
static MenuLayer* menu_layer;
static AppSync sync;
static uint8_t sync_buffer[64];

static int num_of_packages = 0;
static char packages[3][64];
static char delivery_dates[3][64];

typedef enum {
  KEY_PKG_1 = 0x0,
  KEY_PKG_2 = 0x1,
  KEY_PKG_3 = 0x2,
  KEY_PKG_COUNT = 0x3,
} MessageKey;

static void sync_error(DictionaryResult dict_error, 
                       AppMessageResult app_message_error, void *context) {
  APP_LOG(APP_LOG_LEVEL_DEBUG, "App Message Sync Error: %d", app_message_error);
}

static void sync_success(const uint32_t key, const Tuple* new_tuple, 
                         const Tuple* old_tuple, void* context) {
  switch(key) {
    case KEY_PKG_1:
      snprintf(delivery_dates[0], sizeof(delivery_dates[0]), strchr(new_tuple->value->cstring, '|')+1);
      *strchr(new_tuple->value->cstring, '|') = '\0';
      snprintf(packages[0], sizeof(packages[0]), new_tuple->value->cstring);
      break;
    case KEY_PKG_2:
      snprintf(delivery_dates[1], sizeof(delivery_dates[1]), strchr(new_tuple->value->cstring, '|')+1);
      *strchr(new_tuple->value->cstring, '|') = '\0';
      snprintf(packages[1], sizeof(packages[1]), new_tuple->value->cstring);
      break;
    case KEY_PKG_3:
      snprintf(delivery_dates[2], sizeof(delivery_dates[2]), strchr(new_tuple->value->cstring, '|')+1);
      *strchr(new_tuple->value->cstring, '|') = '\0';
      snprintf(packages[2], sizeof(packages[2]), new_tuple->value->cstring);
      break;
    case KEY_PKG_COUNT:
      num_of_packages = new_tuple->value->int16;
      menu_layer_reload_data(menu_layer);
      break;
  }
}

static uint16_t menu_get_num_sections_callback(MenuLayer* menu_layer, void* data) {
  return 1;
}

static uint16_t menu_get_num_rows_callback(MenuLayer* menu_layer, uint16_t section_index, void* data) {
  return num_of_packages;
}

static int16_t menu_get_header_height_callback(MenuLayer* menu_layer, uint16_t section_index, void* data) {
  return MENU_CELL_BASIC_HEADER_HEIGHT;
}

static void menu_draw_header_callback(GContext* ctx, const Layer *cell_layer, uint16_t section_index, void *data) {
  menu_cell_basic_header_draw(ctx, cell_layer, "Packages");
}

static void menu_draw_row_callback(GContext* ctx, const Layer *cell_layer, MenuIndex *cell_index, void *data) {
  menu_cell_basic_draw(ctx, cell_layer, packages[cell_index->row], delivery_dates[cell_index->row], NULL);
}

static void window_load(Window* window) {
  Layer *window_layer = window_get_root_layer(window);
  GRect bounds = layer_get_frame(window_layer);

  menu_layer = menu_layer_create(bounds);

  // Set all the callbacks for the menu layer
  menu_layer_set_callbacks(menu_layer, NULL, (MenuLayerCallbacks){
    .get_num_sections = menu_get_num_sections_callback,
    .get_num_rows = menu_get_num_rows_callback,
    .get_header_height = menu_get_header_height_callback,
    .draw_header = menu_draw_header_callback,
    .draw_row = menu_draw_row_callback,
  });

  menu_layer_set_click_config_onto_window(menu_layer, window);

  layer_add_child(window_layer, menu_layer_get_layer(menu_layer));
  
  Tuplet initial_values[] = {
    TupletCString(KEY_PKG_1, "Package 1|today"),
    TupletCString(KEY_PKG_2, "Package 2|tomorrow"),
    TupletCString(KEY_PKG_3, "Package 3|never"),
    TupletInteger(KEY_PKG_COUNT, (uint8_t) 3)
  };
  
  app_sync_init(&sync, sync_buffer, sizeof(sync_buffer), initial_values, 
                ARRAY_LENGTH(initial_values), sync_success, sync_error, NULL);
}

static void window_unload(Window* window) {
  menu_layer_destroy(menu_layer);
}

static void init(void) {
  window = window_create();
  window_set_window_handlers(window, (WindowHandlers) {
    .load = window_load,
    .unload = window_unload,
  });
  const bool animated = true;
  app_message_open(64, 64);
  window_stack_push(window, animated);
}

static void deinit(void) {
  window_destroy(window);
}

int main(void) {
  init();
  app_event_loop();
  deinit();
}
