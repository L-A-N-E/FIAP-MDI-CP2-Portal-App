// @ts-ignore
import { Calendar } from 'react-native-calendars';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useState } from 'react';
import { checkpoints } from '../../data/checkpoints.data';

export default function CalendarScreen() {

    const [selected, setSelected] = useState('');

    // converte dd/mm/yyyy -> yyyy-mm-dd
    const formatToCalendar = (dateBR) => {
        const [day, month, year] = dateBR.split('/');
        return `${year}-${month}-${day}`;
    };

    // marcar dias no calendario com eventos (checkpoints) de acordo com a data do arquivo checkpoints.data.js
    const markedFromData = checkpoints.reduce((acc, item) => {
        const formatted = formatToCalendar(item.date);

        acc[formatted] = {
            marked: true,
            dotColor: '#FF0C5C'
        };

        return acc;
    }, {});

    // eventos do dia selecionado
    const eventsToday = checkpoints.filter(item =>
        formatToCalendar(item.date) === selected
    );

    return (
        <View style={styles.container}>

            {/* Header */}
            <View style={styles.header}>
                <Image
                    source={require('../../assets/FIAP.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text style={styles.title}>Calendário Acadêmico</Text>
            </View>

            {/* Calendário foi utilizada a lib react-native-calendars: */}
            <View style={styles.calendarContainer}>
                <View style={styles.calendarStyle}>
                    <Calendar
                        onDayPress={(day) => setSelected(day.dateString)}
                        markedDates={{
                            ...markedFromData,
                            [selected]: {
                                ...(markedFromData[selected] || {}),
                                selected: true,
                                selectedColor: '#FF0C5C'
                            }
                        }}
                        theme={{
                            todayTextColor: '#FF0C5C',
                            arrowColor: '#FF0C5C',
                            selectedDayBackgroundColor: '#FF0C5C',
                            dotColor: '#FF0C5C',
                        }}
                    />
                </View>
            </View>
            
            {/* Eventos */}
            {selected !== '' && (
                <View style={styles.eventContainer}>
                    <View style={styles.eventCard}>
                        <Text style={styles.eventTitle}>Eventos nesta data</Text>

                        {eventsToday.length === 0 ? (
                            <Text style={styles.eventMessage}>Nenhum evento em{' '}
                                <Text style={styles.dateHighlight}>{selected}</Text>
                            </Text>
                        ) : (
                            eventsToday.map((event, index) => (
                                <Text key={index} style={styles.eventMessage}>• {event.title} - {event.subject}</Text>
                            ))
                        )}
                    </View>
                </View>
            )}

        </View>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5'
    },
    header: {
        paddingTop: 30,
        alignItems: 'center',
        marginBottom: 10
    },
    logo: {
        width: 140,
        height: 60
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    calendarContainer:{
        flexDirection: 'row',
        justifyContent: 'center',
    },
    calendarStyle:{
        padding: 20,
        borderRadius: 20,
        width: '90%',
        backgroundColor: '#ffffff',
    },
    eventContainer: {
        marginTop: 20,
        elevation: 3,
        flexDirection: 'row',
        justifyContent: 'center'
    },
    eventCard:{
        width: '90%',
        padding: 20,
        borderRadius: 10,
        backgroundColor: '#fff',
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 6,
        textAlign: 'center'
    },
    eventMessage: {
        textAlign: 'center',
        color: '#666'
    },
    dateHighlight: {
        color: '#FF0C5C',
        fontWeight: 'bold'
    }
});