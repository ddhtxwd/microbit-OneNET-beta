// tests go here; this will not be compiled when this package is used as a library
OneNET.WIFI_init(SerialPin.USB_TX, SerialPin.USB_RX)
OneNET.WIFI_connect("XMU-STEAM", "mazhuankuxmu")
OneNET.on_wifi_connected(function () {
    basic.showNumber(1)
    OneNET.OneNET_connect("279878", "550815340", "1234")
})
OneNET.on_mqtt_connected(function () {
    basic.showNumber(1)
})
