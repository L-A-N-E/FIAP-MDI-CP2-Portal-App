import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

function IconWithIndicator({ name, color, focused }) {
    return (
        <View style={{ alignItems: "center" }}>
            {focused && (
                <View
                    style={{
                        height: 1,
                        width: 55,
                        backgroundColor: "#FF0C5C",
                        marginBottom: 5,
                        borderRadius: 2,
                    }}
                />
            )}
            <Ionicons name={name} size={24} color={color} />
        </View>
    );
}

export default function TabsLayout() {
    return (
        <Tabs screenOptions={{ tabBarActiveTintColor: "#FF0C5C" }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color, focused }) => (
                        <IconWithIndicator
                            name="home"
                            color={color}
                            focused={focused}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="bulletin"
                options={{
                    title: "Boletim",
                    tabBarIcon: ({ color, focused }) => (
                        <IconWithIndicator
                            name="school-outline"
                            color={color}
                            focused={focused}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="calendar_screen"
                options={{
                    title: "Calendário",
                    tabBarIcon: ({ color, focused }) => (
                        <IconWithIndicator
                            name="calendar-outline"
                            color={color}
                            focused={focused}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="canteen"
                options={{
                    title: "Kitchenet",
                    tabBarIcon: ({ color, focused }) => (
                        <IconWithIndicator
                            name="restaurant-outline"
                            color={color}
                            focused={focused}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Perfil",
                    tabBarIcon: ({ color, focused }) => (
                        <IconWithIndicator
                            name="person-outline"
                            color={color}
                            focused={focused}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}
