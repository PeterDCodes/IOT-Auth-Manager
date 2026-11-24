from paho.mqtt.client import MQTTv311
from paho.mqtt.publish import single



BROKER_IP = "localhost"
BROKER_PORT = 9000
BEARER_TOKEN = 'test'
TOPIC = 'authtest'
MESSAGE = 'test auth message'


class MQTT:
    def __init__(self, broker="localhost", port=1883):
        self.broker = broker
        self.port = port

    def publish(self, topic, message, qos=1, jwt=None):
        """Connect to the broker, publish one message, and disconnect."""


        # if jwt:
        #     auth = {'username': os.getenv('MQTT_USERNAME', ''), 'password': BEARER_TOKEN}

        single(
            topic, payload=message, qos=qos, hostname=self.broker,
            port=self.port, protocol=MQTTv311,
        )

        print(f'Published to {TOPIC}')


if __name__ == '__main__':


    client = MQTT()

    client.publish(topic=TOPIC, message=MESSAGE, qos=1)
