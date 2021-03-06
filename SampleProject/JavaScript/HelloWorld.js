//c-des This is a sample hello-world script in react-native

import React from "react"

import {
    Text,
    View
} from "react-native"

export default class HelloWorld extends React.Component {
    textValue = "Hello World" //c-var string | textValue | This variable contains a text that to be shown at the screen

    render() {
        return (
            <View
                style = {{
                    alignItems: "center",
                    flex: 1,
                    justifyContent: "center"
                }}
            >
                <Text
                    style = {{
                        fontSize: 24
                    }}
                >
                    {GetTextValue()}
                </Text>
            </View>
        )
    }

    //c-fun String | GetTextValue() | This function is used to get textValue state
    //c-param String | additionalText | Additional text to be added at textValue
    GetTextValue(additionalText) {
        return this.state.textValue + additionalText
    }
}