const readline = require('readline');
const EventEmitter = require('events');

class CustomAlarm extends EventEmitter {
    constructor() {
        super();
        this.alarms = [];
        this.snoozedInterval = 5 * 60 * 1000;
        this.maxSnoozes = 3;
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this.isHandlingAlarm = false;
        this.startAlarmCheck();
        this.inputUserActionHandler();
    }

    startAlarmCheck() {
        setInterval(() => {
            const currentTime = new Date();
            this.checkAlarms(currentTime);
        }, 1000);
    }

    displayCurrentTime() {
        const date = new Date();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        console.log(`Current Time: ${hours}:${minutes}:${seconds}`);
    }

    checkAlarms(currentTime) {
        const currentDay = currentTime.getDay();
        const currentTimeStr = `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`;

        for (let alarm of this.alarms) {
            if (alarm.day === currentDay && alarm.time === currentTimeStr) {
                if (!this.isHandlingAlarm) {
                    this.isHandlingAlarm = true;
                    console.log(`Alarm! Time: ${alarm.time}`);
                    this.handleAlarmPrompt(alarm);
                }
                return;
            }
        }
    }

    inputUserActionHandler() {
        this.promptUser();
    }

    promptUser() {
        if (!this.isHandlingAlarm) {
            this.rl.question(`Choose an option:
1. Display current time
2. Create alarms
3. Delete alarms
4. List alarms
5. Exit
Your choice: `
                , (choice) => {
                    switch (choice.trim()) {
                        case '1':
                            this.displayCurrentTime();
                            this.promptUser();
                            break;
                        case '2':
                            this.setAlarmHandler(() => this.promptUser());
                            break;
                        case '3':
                            this.listAndDeleteAlarmsHandler(() => this.promptUser());
                            break;
                        case '4':
                            this.listAlarms(() => this.promptUser());
                            break;
                        case '5':
                            console.log('Exiting the application.');
                            this.rl.close();
                            process.exit(0);
                            break;
                        default:
                            console.log(`------Invalid Choice, Choose among------`);
                            this.promptUser();
                    }
                });
        }
    }

    setAlarmHandler(callback) {
        this.rl.question('Set alarm (e.g., 1 23:30): ', (input) => {
            const [day, time] = input.trim().split(' ');
            this.setAlarm([day, time]);
            callback();
        });
    }

    listAndDeleteAlarmsHandler(callback) {
        if (this.alarms.length === 0) {
            console.log('No alarms set.');
            callback();
            return;
        }

        console.log('Current alarms:');
        this.alarms.forEach((alarm, index) => {
            console.log(`${index + 1}. Day: ${alarm.day}, Time: ${alarm.time}`);
        });

        this.rl.question('Enter the number of the alarm you want to delete: ', (number) => {
            const index = parseInt(number.trim()) - 1;
            if (index >= 0 && index < this.alarms.length) {
                const alarm = this.alarms[index];
                this.deleteAlarm(alarm.time);
            } else {
                console.log('Invalid number.');
            }
            callback();
        });
    }

    listAlarms(callback) {
        if (this.alarms.length === 0) {
            console.log('No alarms set.');
        } else {
            console.log('Current alarms:');
            this.alarms.forEach((alarm, index) => {
                console.log(`${index + 1}. Day: ${alarm.day}, Time: ${alarm.time}`);
            });
        }
        callback();
    }

    handleAlarmPrompt(alarm) {
        const alarmPrompt = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const promptForAction = () => {
            return new Promise((resolve) => {
                alarmPrompt.question('Type "1" to snooze for 5 minutes or "2" to dismiss: ', (answer) => {
                    resolve(answer.trim());
                });
            });
        };

        (async () => {
            while (true) {
                const action = await promptForAction();
                if (action === '1') {
                    this.snoozeAlarm(alarm.time);
                    this.isHandlingAlarm = false;
                    this.promptUser();
                    break;
                } else if (action === '2') {
                    this.deleteAlarm(alarm.time);
                    this.isHandlingAlarm = false;
                    this.promptUser();
                    break;
                } else {
                    console.log('Invalid choice. Please type "1" to snooze or "2" to dismiss.');
                }
            }
        })();
    }

    setAlarm(args) {
        const [day, time] = args;
        this.alarms.push({ day: parseInt(day), time, snoozed: 0 });
        console.log(`Alarm set for day ${day} at ${time}`);
    }

    snoozeAlarm(time) {
        const alarm = this.alarms.find(alarm => alarm.time === time);
        if (alarm && alarm.snoozed < this.maxSnoozes) {
            const [hours, minutes] = time.split(':').map(Number);
            const currentTime = new Date();
            currentTime.setHours(hours);
            currentTime.setMinutes(minutes + 5);
            alarm.time = `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`;
            alarm.snoozed++;
            console.log(`Alarm snoozed to ${alarm.time}`);
        } else {
            console.log('Alarm does not exist or has reached maximum snoozes');
        }
    }

    deleteAlarm(time) {
        const alarmIndex = this.alarms.findIndex(alarm => alarm.time === time);
        if (alarmIndex !== -1) {
            this.alarms.splice(alarmIndex, 1);
            console.log(`Alarm at ${time} deleted successfully`);
        } else {
            console.log('No alarm exists at this time');
        }
    }
}

const customAlarm = new CustomAlarm();
