/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import BleManager from 'react-native-ble-plx/src/BleManager';
import find from 'lodash/find';
import isEqual from 'lodash/isEqual';


export default class BlePlx extends Component {
  constructor(props) {
    super(props);
    this.manager = new BleManager();
    this.state = {
      devices: [],
      deviceServices: [],
      serviceCharacteristics: [],
      connectedDevice: undefined,
      readValue: '',
      log: 'Entry point',
    }
  }

  componentWillMount() {
    const subscription = this.manager.onStateChange((state) => {
      if (state === 'PoweredOn') {
        this.scanAndConnect();
        subscription.remove();
      }
    }, true);
  }

  scanAndConnect() {
    this.manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        return
      }

      // 이미 발견이 되었던 거면 추가하지 않는다
      // 발견되지 않은 거면 추가한다
      if (device.id && device.name) {
        if (!find(this.state.devices, (prediscoveredDevice) => prediscoveredDevice.id === device.id)) {
          this.setState({
            devices: [
              ...this.state.devices,
              device,
            ],
          })
        }
      }
    });
  }

  onDeviceSelect = (device) => {
    this.setState({
      connectedDevice: device,
    })
    this.manager.stopDeviceScan();
  }

  componentDidUpdate = (prevProps, prevState) => {
    if (!isEqual(prevState.connectedDevice, this.state.connectedDevice)) {
      if (this.state.connectedDevice && this.state.connectedDevice.connect) {
        this.setState({
          log: 'yolo!',
        })
        this.tryConnectToDevice(this.state.connectedDevice)
      }
    }
  }

  connectToService = (device, serviceUuid) => {

  }

  tryConnectToDevice = (device) => {
    if (device.connect) { // check if it is actual bluetooth device
      device.connect()
        .then((device) => {
          this.setState({
            log: `connected to device: ${device.name}`
          })
          return device.discoverAllServicesAndCharacteristics()
        })
        .then((device) => {
          this.setState({
            log: `discovered all services and characteristics for : ${device.name}`,
          })
          return device.services()
        })
        .then((services) => {
          this.setState({
            log: `resolved services() for : ${device.name}`,
            deviceServices: services,
          })
          const serviceToRead = find(services, (service) => service.uuid === '49535343-fe7d-4ae5-8fa9-9fafd205e455')
          return serviceToRead.characteristics()
        })
        .then((characteristics) => {
          const characteristicToRead = find(characteristics, (characteristic) => characteristic.uuid === '49535343-1e4d-4bd9-ba61-23c647249616')
          this.setState({
            log: `resolved characteristics() for : ${device.name}`,
            serviceCharacteristics: characteristics,
          })
          return characteristicToRead.monitor((error, characteristic) => {
            if (error) {
              return Promise.reject('Failed to monitor from characteristic');
            }
            this.setState({
              readValue: characteristic.value,
            })
          })
        })
        .catch((error) => {
          this.setState({
            error: error,
            log: error,
          })
        });
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <View
          style={{
            height: 100,
            backgroundColor: 'pink',
            marginTop: 20,
          }}
        >
          {this.state.connectedDevice ? (
            <View>
              <View>
                <Text>
                  Connected Device: {this.state.connectedDevice.name}
                </Text>
              </View>
            </View>
          ) : <Text>No connected device!!</Text>
          }
          {this.state.deviceServices ? (
            <View>
              <Text>
                Supported Services:
              </Text>
              <View>
                {this.state.deviceServices && this.state.deviceServices.map((service) => {
                  return (
                    <Text>
                      {service.uuid}
                    </Text>
                  )
                })}
              </View>
            </View>
          ) : <Text>Discovered Services: {this.state.deviceServices.length}</Text>}
          {this.state.serviceCharacteristics ? (
            <View>
              <Text>
                Supported Characteristics:
              </Text>
              <View>
                {this.state.serviceCharacteristics && this.state.serviceCharacteristics.map((characteristic) => {
                  return (
                    <Text>
                      {characteristic.uuid}
                    </Text>
                  )
                })}
              </View>
            </View>
          ) : <Text>Discovered Characteristics: {this.state.serviceCharacteristics.length}</Text>}
        </View>
        {this.state.devices.map((device) => (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              height: 40,
            }}
          >
            <View>
              <Text style={styles.instructions}>
                {device.name}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => this.onDeviceSelect(device)}
              style={{
                backgroundColor: 'gray',
              }}
            >
              <Text>
                Connect
              </Text>
            </TouchableOpacity>
          </View>
        ))}
        <View>
          <Text>
            Read Value: {this.state.readValue}
          </Text>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

AppRegistry.registerComponent('BlePlx', () => BlePlx);
