
/**
 * 使用此文件来定义自定义函数和图形块。
 * 想了解更详细的信息，请前往 https://makecode.microbit.org/blocks/custom
 */

/**
 * 自定义图形块
 */
enum SonicPingUnit {
	//% block="厘米"
	Centimeters,
	//% block="微秒"
	MicroSeconds,
	//% block="英寸"
	Inches
}

//% weight=100 color=#0fbc11 icon="\uf1eb"
namespace OneNET {

    let serial_read: string;
    let receive_id: string;
    let receive_value: string;
    let is_mqtt_conneted = false;
    let is_wifi_conneted = false;
    let is_uart_inited = false;
    
    let wifi_conneted: () => void = null;
    let mqtt_conneted: () => void = null;
    let mqtt_received: () => void = null;

    

    serial.onDataReceived('\n', function () {
        serial_read = serial.readString()
        if (serial_read.includes("AT")) {
            if (serial_read.includes("XMU_WIFI") && serial_read.includes("OK")) {
                is_wifi_conneted = true
                //if (wifi_conneted) wifi_conneted()
            }
            else if (serial_read.includes("ONENET") && serial_read.includes("OK")) {
                is_mqtt_conneted = true
                //if (mqtt_conneted) mqtt_conneted()
            }
            else if (serial_read.includes("RECEIVE")) {
                let start_index = 11
                receive_value = serial_read.substr(start_index, serial_read.length - start_index)
				while (receive_value.length > 0) {
					let c = receive_value.substr(receive_value.length - 1, receive_value.length)
					if (c == '\r' || c == '\n') {
						receive_value = receive_value.substr(0, receive_value.length - 1)
					} else {
						break
					}
				}
                if (mqtt_received) mqtt_received()
            }
        }
    })

    //% block="连接到服务器成功"
    //% subcategory="联网"
    export function is_connected(): boolean {
        return is_mqtt_conneted;
    }
	
	/**
     * 向另一个设备发送信息
     * @param data_id ; eg: "cmd"
     * @param data_value ; eg: "28.5"
    */
    //% block="向另一个设备发送信息 话题名称：$data_id 内容：$data_value"
    //% subcategory="联网"
    export function OneNET_publish(data_id: string, data_value: string): void {

        if(is_mqtt_conneted==false)return;

        let cmd: string = "AT+PUBLISH=" + data_id + ',' + data_value + '\n'
        serial.writeString(cmd)
        basic.pause(100)
    }
	
	/**
     * 开启接收另一个设备的信息
     * @param data_id ; eg: "cmd"
    */
    //% block="开启接收另一个设备的信息 话题名称：$data_id"
    //% subcategory="联网"
    export function OneNET_subscribe(data_id: string): void {
        if(is_mqtt_conneted==false)return;

        let cmd: string = "AT+SUBSCRIBE=" + data_id + '\n'
        serial.writeString(cmd)
        basic.pause(100)
    }

    /**
     * On 收到OneNET的命令
     * @param handler MQTT receiveed callback
    */
    //% block="当收到命令时"
    //% subcategory="联网"
    export function on_mqtt_receiveed(handler: () => void): void {
        mqtt_received = handler;
    }
    
    /**
     * OneNET连接成功
     * @param handler MQTT connected callback
    */
    //% block="OneNET连接成功"
    //% subcategory="联网"
    export function on_mqtt_connected(handler: () => void): void {
        mqtt_conneted = handler;
    }
    
    /**
     * WIFI连接成功
     * @param handler WIFI connected callback
    */
    //% block="WIFI连接成功"
    //% subcategory="联网"
    export function on_wifi_connected(handler: () => void): void {
        wifi_conneted = handler;
    }

    //% block="收到的命令"
    //% subcategory="联网"
    export function get_value(): string {
        return receive_value;
    }
    /**
     * 向OneNET发送信息
     * @param data_id ; eg: "temp"
     * @param data_value ; eg: "28.5"
    */
    //% block="向OneNET发送信息 数据流名称：$data_id 内容：$data_value"
    //% subcategory="联网"
    export function OneNET_send(data_id: string, data_value: string): void {
        if(is_mqtt_conneted==false)return;
        let cmd: string = "AT+ON_SEND=" + data_id + ',' + data_value + '\n'
        serial.writeString(cmd)
        basic.pause(100)
    }
    /**
     * 连接OneNET
     * @param product_id ; eg: "123456"
     * @param machine_id ; eg: "123456789"
     * @param pass ; eg: "1234"
    */
    //% block="连接OneNET 产品ID：$product_id 设备ID：$machine_id 鉴权信息：$pass"
    //% subcategory="联网"
    export function OneNET_connect(product_id: string, machine_id: string, pass: string): void {
        is_mqtt_conneted = false

        let cmd: string = "AT+ONENET=" + product_id + ',' + machine_id + ',' + pass + '\n'
        basic.pause(100)
        while(is_mqtt_conneted==false){
            serial.writeString(cmd)
            let start_time = control.millis()
            while(control.millis() - start_time < 5000){
                basic.pause(10)
                if(is_mqtt_conneted){
                    if (mqtt_conneted) mqtt_conneted()
                    break;
                }
            }
        }
    }

    /**
     * 连接WIFI
     * @param ssid ; eg: "WIFI"
     * @param pass ; eg: "12345678"
    */
    //% block="连接WIFI 名称：$ssid 密码：$pass"
    //% subcategory="联网"
    export function WIFI_connect(ssid: string, pass: string): void {
        is_wifi_conneted = false
        
        serial.redirect(
            SerialPin.P13,
            SerialPin.P14,
            BaudRate.BaudRate115200
        )
        basic.pause(100)
        is_uart_inited = true
        let cmd: string = "AT+XMU_WIFI=" + ssid + ',' + pass + '\n'
        while(is_wifi_conneted==false){
            serial.writeString(cmd)
            let start_time = control.millis()
            while(control.millis() - start_time < 5000){
                basic.pause(100)
                if(is_wifi_conneted){
                    if (wifi_conneted) wifi_conneted()
                    break;
                }
            }
        }
        basic.pause(100)
    }

    /**
     * 显示数字
     * @param x ; eg: 0
     * @param y ; eg: 0
     * @param number ; eg: 666
    */
    //% block="在屏幕的位置第 $x 行第 $y 列上显示数字: $number"
    //% subcategory="显示"
    export function lcd_display_number(x: number, y: number, number: number): void {
        let cmd: string = "AT+DRAW=" + convertToText(x) + ',' + convertToText(y+1) + ',' + convertToText(number) + '\n'
        if(is_uart_inited == false){
            serial.redirect(
                SerialPin.P13,
                SerialPin.P14,
                BaudRate.BaudRate115200
            )
            basic.pause(100)
            is_uart_inited = true
        }
        serial.writeString(cmd)
        basic.pause(100)
    }

    /**
     * 显示文本
     * @param x ; eg: 0
     * @param y ; eg: 0
     * @param string ; eg: "hello world"
    */
    //% block="在屏幕的位置第 $x 行第 $y 列上显示文本: $string"
    //% subcategory="显示"
    export function lcd_display_string(x: number, y: number, string: string): void {
        let cmd: string = "AT+DRAW=" + convertToText(x) + ',' + convertToText(y+1) + ',' + string + '\n'
        if(is_uart_inited == false){
            serial.redirect(
                SerialPin.P13,
                SerialPin.P14,
                BaudRate.BaudRate115200
            )
            basic.pause(100)
            is_uart_inited = true
        }
        serial.writeString(cmd)
        basic.pause(100)
    }

    //% block="清除显示"
    //% subcategory="显示"
    export function lcd_clear(): void {
        let cmd: string = "AT+DRAW=0,1,.Clear.\n"
        if(is_uart_inited == false){
            serial.redirect(
                SerialPin.P13,
                SerialPin.P14,
                BaudRate.BaudRate115200
            )
            basic.pause(100)
            is_uart_inited = true
        }
        serial.writeString(cmd)
        basic.pause(200)
    }

    

    /**
     * Send a ping and get the echo time (in microseconds) as a result
     * @param trig tigger pin
     * @param echo echo pin
     * @param unit desired conversion unit
     * @param maxCmDistance maximum distance in centimeters (default is 500)
     */
    //% blockId=sonar_ping block="超声波| trig %trig|echo %echo|单位 %unit"
    //% subcategory="传感器"
    export function ping(trig: DigitalPin, echo: DigitalPin, unit: SonicPingUnit, maxCmDistance = 500): number {
        // send pulse
        pins.setPull(trig, PinPullMode.PullNone);
        pins.digitalWritePin(trig, 0);
        control.waitMicros(2);
        pins.digitalWritePin(trig, 1);
        control.waitMicros(10);
        pins.digitalWritePin(trig, 0);

        // read pulse
        const d = pins.pulseIn(echo, PulseValue.High, maxCmDistance * 58);

        switch (unit) {
            case SonicPingUnit.Centimeters: return Math.idiv(d, 58);
            case SonicPingUnit.Inches: return Math.idiv(d, 148);
            default: return d;
        }
    }

    function signal_dht11(pin: DigitalPin): void {
        pins.digitalWritePin(pin, 0);
        basic.pause(18);
        let i = pins.digitalReadPin(pin);
        pins.setPull(pin, PinPullMode.PullUp);
    }

    function dht11_read(pin: DigitalPin): number {
        signal_dht11(pin);
        let wait_time = 0;
        // Wait for response header to finish
        while (pins.digitalReadPin(pin) == 1);
        while (pins.digitalReadPin(pin) == 0);
        while (pins.digitalReadPin(pin) == 1);

        let value = 0;
        let counter = 0;

        for (let i = 0; i <= 32 - 1; i++) {
            while (pins.digitalReadPin(pin) == 0);
            counter = 0
            while (pins.digitalReadPin(pin) == 1) {
                counter += 1;
            }
            if (counter > 4) {
                value = value + (1 << (31 - i));
            }
        }
        return value;
    }

    export enum Dht11Result {
        //% block="摄氏度"
        Celsius,
        //% block="华氏度"
        Fahrenheit,
        //% block="湿度"
        humidity
    }

    //% blockId=get_DHT11_value block="DHT11 引脚 %pin_arg|获取 %dhtResult" blockExternalInputs=true
    //% pin_arg.fieldEditor="gridpicker" pin_arg.fieldOptions.columns=4
    //% pin_arg.fieldOptions.tooltips="false" pin_arg.fieldOptions.width="300"
    //% subcategory="传感器"
    export function get_DHT11_value(pin_arg: DigitalPin, dhtResult: Dht11Result): number {
        switch (dhtResult) {
            case Dht11Result.Celsius: return (dht11_read(pin_arg) & 0x0000ff00) >> 8;
            case Dht11Result.Fahrenheit: return ((dht11_read(pin_arg) & 0x0000ff00) >> 8) * 9 / 5 + 32;
            case Dht11Result.humidity: return dht11_read(pin_arg) >> 24;
            default: return 0;
        }
    }

        /**
     * button pushed.
     */
    //% blockId=onPressEvent
    //% block="on |%btn| button pressed" shim=IrRemote::onPressEvent group="micro:bit(v1)"
    //% subcategory="传感器"
    export function OnPressEvent(btn: RemoteButton, body: () => void): void {
        return;
    }

    /**
     * initialises local variablesssss
     *  @param pin describe parameter here, eg: IrPins.P5  
     */
    //% blockId=IrRemote_init 
    //% block="connect ir receiver to %pin" shim=IrRemote::IrRemote_init group="micro:bit(v1)"
    //% subcategory="传感器"
    export function IrRemote_init(pin: Pins): void {
        return;
    }
    
    
    export class Packeta {
        public mye: string;
        public myparam: number;
    }


    let irstate:string;
    let state:number;
    /**
     * Read IR sensor value V2.
     */

    //% advanced=true shim=maqueenIRV2::irCode
    function irCode(): number {
        return 0;
    }

    //% weight=5
    //% group="micro:bit(v2)"
    //% blockId=IR_readv2 block="read IR key value"
    //% subcategory="传感器"
    export function IR_readV2(): string {
        let val = valuotokeyConversion();
        let str;
        switch (val) {
            case 11: str = 'A'; break;
            case 12: str = 'B'; break;
            case 13: str = 'C'; break;
            case 14: str = 'D'; break;
            case 21: str = 'UP'; break;
            case 66: str = '+'; break;
            case 24: str = 'LEFT'; break;
            case 55: str = 'OK'; break;
            case 22: str = 'RIGHT'; break;
            case 0: str = '0'; break;
            case 23: str = 'DOWN'; break;
            case 99: str = '-'; break;
            case 1: str = '1'; break;
            case 2: str = '2'; break;
            case 3: str = '3'; break;
            case 4: str = '4'; break;
            case 5: str = '5'; break;
            case 6: str = '6'; break;
            case 7: str = '7'; break;
            case 8: str = '8'; break;
            case 9: str = '9'; break;
            default:
                str = '-1';
        }
        return str;
    }

    //% weight=2
    //% group="micro:bit(v2)"
    //% blockId=IR_callbackUserv2 block="on IR received"
    //% draggableParameters
    //% subcategory="传感器"
    export function IR_callbackUserV2(cb: (message: string) => void) {
        state = 1;
        control.onEvent(11, 22, function() {
            cb(irstate)
        }) 
    }

    function valuotokeyConversion(): number {
        let irdata: number;
        switch (irCode()) {
            case 0xba45: irdata = 11; break;
            case 0xb946: irdata = 12; break;
            case 0xb847: irdata = 13; break;
            case 0xbb44: irdata = 14; break;
            case 0xbf40: irdata = 21; break;
            case 0xbc43: irdata = 66; break;
            case 0xf807: irdata = 24; break;
            case 0xea15: irdata = 55; break;
            case 0xf609: irdata = 22; break;
            case 0xe916: irdata = 0; break;
            case 0xe619: irdata = 23; break;
            case 0xf20d: irdata = 99; break;
            case 0xf30c: irdata = 1; break;
            case 0xe718: irdata = 2; break;
            case 0xa15e: irdata = 3; break;
            case 0xf708: irdata = 4; break;
            case 0xe31c: irdata = 5; break;
            case 0xa55a: irdata = 6; break;
            case 0xbd42: irdata = 7; break;
            case 0xad52: irdata = 8; break;
            case 0xb54a: irdata = 9; break;
            default:
                irdata = -1;
        }
        return irdata;
    }

    basic.forever(() => {
        if(state == 1){
            irstate = IR_readV2();
            if(irstate != '-1'){
                control.raiseEvent(11, 22)
            }
        }
    
        basic.pause(20);
    })
}


