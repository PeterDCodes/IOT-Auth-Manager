import sys
from time import monotonic

import paho.mqtt.client as mqtt

BROKER_IP = "localhost"
BROKER_PORT = 9100
BEARER_TOKEN = 'test'
TOPIC = 'authtest'
MESSAGE = 'test auth message'

PASSWORD = "Your-JWT-Here"

class MQTT:
    def __init__(self, broker="localhost", port=1883):
        self.broker = broker
        self.port = port

    def publish(self, topic, message, qos=1, auth=None):
        """Connect to the broker, publish one message, and disconnect."""

        client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, protocol=mqtt.MQTTv311)
        client.username_pw_set('test_username', PASSWORD)
        endpoint = f'{self.broker}:{self.port}'
        stage = 'broker connection response'
        published = False

        def on_connect(client, userdata, flags, reason, properties):
            nonlocal stage
            if reason.is_failure:
                raise RuntimeError(f'Broker refused connection: {reason}')
            stage = f'publish completion for {topic!r}'
            result = client.publish(topic, payload=message, qos=qos)
            if result.rc != mqtt.MQTT_ERR_SUCCESS:
                raise RuntimeError(f'Publish failed: {mqtt.error_string(result.rc)}')

        def on_publish(client, userdata, mid, reason, properties):
            nonlocal published
            published = True

        client.on_connect = on_connect
        client.on_publish = on_publish

        try:
            try:
                client.tls_set()
                result = client.connect(self.broker, self.port)
            except OSError as error:
                raise RuntimeError(f'Network connection failed: {error}') from error
            if result != mqtt.MQTT_ERR_SUCCESS:
                raise RuntimeError(f'Connection failed: {mqtt.error_string(result)}')

            deadline = monotonic() + 10
            while not published:
                remaining = deadline - monotonic()
                if remaining <= 0:
                    raise RuntimeError(f'Timed out waiting for {stage}')
                result = client.loop(timeout=remaining)
                if not published and result != mqtt.MQTT_ERR_SUCCESS:
                    detail = mqtt.error_string(result)
                    raise RuntimeError(f'Disconnected while waiting for {stage}: {detail}')
        except (OSError, RuntimeError, ValueError) as error:
            raise RuntimeError(f'MQTT {endpoint}: {error}') from error
        finally:
            client.disconnect()

        print(f'Published to {topic}')

if __name__ == '__main__':
    client = MQTT(broker=BROKER_IP, port=BROKER_PORT)
    try:
        client.publish(topic=TOPIC, message=MESSAGE, qos=1)
    except RuntimeError as error:
        print(error, file=sys.stderr)
        sys.exit(1)
