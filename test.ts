// tests go here; this will not be compiled when this package is used as a library
OneNET.WIFI_connect("WIFI", "12345678")
OneNET.lcd_clear()
OneNET.lcd_display_string(0, 0, "hello world")
OneNET.lcd_display_number(0, 1, 666)