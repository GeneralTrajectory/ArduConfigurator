import type { FirmwareMetadataBundle, ParameterValueOption } from './types.js'
import {
  ARDUCOPTER_BATTERY_FAILSAFE_ACTION_LABELS,
  ARDUCOPTER_FLIGHT_MODE_LABELS,
  ARDUCOPTER_FRAME_CLASS_LABELS,
  ARDUCOPTER_FRAME_TYPE_LABELS,
  ARDUCOPTER_GPS_TYPE_LABELS,
  ARDUCOPTER_MOT_PWM_TYPE_LABELS,
  ARDUCOPTER_SERIAL_BAUD_LABELS,
  ARDUCOPTER_SERIAL_PROTOCOL_LABELS,
  ARDUCOPTER_SERIAL_RTSCTS_LABELS,
  ARDUCOPTER_SERVO_FUNCTION_LABELS,
  ARDUCOPTER_THROTTLE_FAILSAFE_LABELS,
} from './arducopter-enums.js'

const enabledDisabledOptions: ParameterValueOption[] = [
  { value: 0, label: 'Disabled' },
  { value: 1, label: 'Enabled' }
]

const rcEndpointNotes = [
  'Receiver endpoint changes should be followed by another live RC range verification pass.'
]

const rcMapNotes = [
  'Changing RCMAP_* requires a reboot before the new mapping is fully applied.',
  'After changing RC mapping, repeat RC endpoint capture before flight.'
]

const serialProtocolNotes = [
  'Changing a serial port protocol usually requires a reboot before the new port role is fully applied.',
  'After changing a port role, reconnect the peripheral and verify telemetry before flight.'
]

const serialBaudNotes = [
  'Baud-rate changes should be matched to the connected peripheral before reconnecting.'
]

const serialFlowControlNotes = [
  'Only enable RTS/CTS flow control if the connected peripheral and wiring support it.'
]

const flightFeelNotes = [
  'Make small changes, fly-test, and keep a known-good backup before pushing responsiveness further.',
  'These controls are intended to stay beginner-safe; use Expert mode for deeper controller tuning.'
]

const acroRateNotes = [
  'Rates and expo are best adjusted a little at a time, with a short hover or line-of-sight test between changes.',
  'This first tuning surface intentionally stops at rates and expo so the setup workflow stays approachable.'
]

function serialPortDisplayName(portNumber: number): string {
  switch (portNumber) {
    case 0:
      return 'USB / Console'
    case 1:
      return 'Telemetry 1'
    case 2:
      return 'Telemetry 2'
    case 3:
      return 'GPS / UART3'
    default:
      return `Serial ${portNumber}`
  }
}

function enumOptions(labelMap: Record<number, string>): ParameterValueOption[] {
  return Object.entries(labelMap)
    .map(([value, label]) => ({
      value: Number(value),
      label
    }))
    .sort((left, right) => left.value - right.value)
}

function buildSerialPortParameterDefinitions(maxPortNumber: number): FirmwareMetadataBundle['parameters'] {
  const definitions: FirmwareMetadataBundle['parameters'] = {}

  for (let portNumber = 0; portNumber <= maxPortNumber; portNumber += 1) {
    const portLabel = serialPortDisplayName(portNumber)

    definitions[`SERIAL${portNumber}_PROTOCOL`] = {
      id: `SERIAL${portNumber}_PROTOCOL`,
      label: `${portLabel} Protocol`,
      description: `Assigned serial protocol for ${portLabel}.`,
      category: 'ports',
      minimum: -1,
      maximum: 50,
      rebootRequired: true,
      notes: serialProtocolNotes,
      options: enumOptions(ARDUCOPTER_SERIAL_PROTOCOL_LABELS)
    }

    definitions[`SERIAL${portNumber}_BAUD`] = {
      id: `SERIAL${portNumber}_BAUD`,
      label: `${portLabel} Baud`,
      description: `Configured baud rate for ${portLabel}.`,
      category: 'ports',
      minimum: 1,
      maximum: 2000,
      notes: serialBaudNotes,
      options: enumOptions(ARDUCOPTER_SERIAL_BAUD_LABELS)
    }

    if (portNumber > 0 && portNumber <= 6) {
      definitions[`BRD_SER${portNumber}_RTSCTS`] = {
        id: `BRD_SER${portNumber}_RTSCTS`,
        label: `${portLabel} Flow Control`,
        description: `RTS/CTS flow-control behavior for ${portLabel}.`,
        category: 'ports',
        minimum: 0,
        maximum: 3,
        rebootRequired: true,
        notes: serialFlowControlNotes,
        options: enumOptions(ARDUCOPTER_SERIAL_RTSCTS_LABELS)
      }
    }
  }

  return definitions
}

export const arducopterMetadata: FirmwareMetadataBundle = {
  firmware: 'ArduCopter',
  appViews: [
    {
      id: 'setup',
      label: 'Setup',
      description: 'Connection, calibration, and guided setup.',
      order: 1
    },
    {
      id: 'ports',
      label: 'Ports',
      description: 'Serial roles, GPS links, and peripheral setup.',
      order: 2
    },
    {
      id: 'receiver',
      label: 'Receiver',
      description: 'RC mapping, ranges, and flight modes.',
      order: 3
    },
    {
      id: 'outputs',
      label: 'Outputs',
      description: 'Airframe, outputs, motor tests, and ESC review.',
      order: 4
    },
    {
      id: 'power',
      label: 'Power',
      description: 'Battery, failsafe, and pre-arm review.',
      order: 5
    },
    {
      id: 'tuning',
      label: 'Tuning',
      description: 'Beginner-safe flight-feel and acro-rate tuning.',
      order: 6
    },
    {
      id: 'parameters',
      label: 'Parameters',
      description: 'Low-level parameter editing and backup work.',
      order: 7
    }
  ],
  categories: {
    airframe: {
      id: 'airframe',
      label: 'Airframe',
      description: 'Frame geometry, type, and mounting configuration.',
      order: 1,
      viewId: 'outputs'
    },
    sensors: {
      id: 'sensors',
      label: 'Sensors',
      description: 'Board orientation and sensor-related setup.',
      order: 2,
      viewId: 'setup'
    },
    ports: {
      id: 'ports',
      label: 'Ports',
      description: 'Serial roles, baud rates, and peripheral transport settings.',
      order: 3,
      viewId: 'ports'
    },
    peripherals: {
      id: 'peripherals',
      label: 'Peripherals',
      description: 'GPS and other externally attached peripherals.',
      order: 4,
      viewId: 'ports'
    },
    radio: {
      id: 'radio',
      label: 'Receiver',
      description: 'RC mapping, ranges, and calibration values.',
      order: 5,
      viewId: 'receiver'
    },
    modes: {
      id: 'modes',
      label: 'Modes',
      description: 'Flight-mode assignments and switch setup.',
      order: 6,
      viewId: 'receiver'
    },
    outputs: {
      id: 'outputs',
      label: 'Outputs',
      description: 'Motor, servo, and propulsion-related outputs.',
      order: 7,
      viewId: 'outputs'
    },
    power: {
      id: 'power',
      label: 'Power',
      description: 'Battery sensing and power monitoring.',
      order: 8,
      viewId: 'power'
    },
    failsafe: {
      id: 'failsafe',
      label: 'Failsafe',
      description: 'Throttle, battery, and failsafe behavior.',
      order: 9,
      viewId: 'power'
    },
    tuning: {
      id: 'tuning',
      label: 'Flight Feel',
      description: 'Simple multirotor handling adjustments for angle mode and general stick feel.',
      order: 10,
      viewId: 'tuning'
    },
    acro: {
      id: 'acro',
      label: 'Acro Rates',
      description: 'Acro roll, pitch, and yaw rates plus expo.',
      order: 11,
      viewId: 'tuning'
    }
  },
  parameters: {
    FRAME_CLASS: {
      id: 'FRAME_CLASS',
      label: 'Frame Class',
      description: 'Primary airframe class for the vehicle.',
      category: 'airframe',
      minimum: 0,
      maximum: 17,
      rebootRequired: true,
      notes: ['After changing frame geometry, refresh outputs and re-check motor direction before flight.'],
      options: enumOptions(ARDUCOPTER_FRAME_CLASS_LABELS)
    },
    FRAME_TYPE: {
      id: 'FRAME_TYPE',
      label: 'Frame Type',
      description: 'Specific motor geometry within the selected frame class.',
      category: 'airframe',
      minimum: 0,
      maximum: 19,
      rebootRequired: true,
      notes: ['Frame-type changes should be followed by a reboot and another output review.'],
      options: enumOptions(ARDUCOPTER_FRAME_TYPE_LABELS)
    },
    AHRS_ORIENTATION: {
      id: 'AHRS_ORIENTATION',
      label: 'Board Orientation',
      description: 'Mounting orientation for the flight controller.',
      category: 'sensors',
      notes: ['If the board orientation changes, repeat accelerometer calibration before flight.']
    },
    COMPASS_USE: {
      id: 'COMPASS_USE',
      label: 'Compass Enabled',
      description: 'Primary compass enable state.',
      category: 'sensors',
      minimum: 0,
      maximum: 1,
      options: enabledDisabledOptions
    },
    ...buildSerialPortParameterDefinitions(6),
    GPS_TYPE: {
      id: 'GPS_TYPE',
      label: 'Primary GPS Type',
      description: 'Driver type used for the primary GPS/peripheral input.',
      category: 'peripherals',
      minimum: 0,
      maximum: 25,
      rebootRequired: true,
      notes: ['After changing GPS driver types, reconnect the sensor and verify lock/telemetry before flight.'],
      options: enumOptions(ARDUCOPTER_GPS_TYPE_LABELS)
    },
    GPS_TYPE2: {
      id: 'GPS_TYPE2',
      label: 'Secondary GPS Type',
      description: 'Driver type used for the secondary GPS/peripheral input.',
      category: 'peripherals',
      minimum: 0,
      maximum: 25,
      rebootRequired: true,
      notes: ['Disable this if no secondary GPS is attached. Reboot after changes before verifying redundancy.'],
      options: enumOptions(ARDUCOPTER_GPS_TYPE_LABELS)
    },
    BATT_MONITOR: {
      id: 'BATT_MONITOR',
      label: 'Battery Monitor',
      description: 'Battery sensing source configuration.',
      category: 'power',
      minimum: 0,
      notes: ['Use a live powered session to confirm that the selected battery monitor is actually producing telemetry.']
    },
    BATT_CAPACITY: {
      id: 'BATT_CAPACITY',
      label: 'Battery Capacity',
      description: 'Nominal battery capacity used for failsafe and remaining estimate.',
      category: 'power',
      unit: 'mAh',
      minimum: 0,
      step: 1,
      notes: ['Match this to the pack capacity that the vehicle will actually fly with.']
    },
    BATT_FS_LOW_ACT: {
      id: 'BATT_FS_LOW_ACT',
      label: 'Low Battery Failsafe Action',
      description: 'Action taken when the low battery failsafe threshold is reached.',
      category: 'failsafe',
      minimum: 0,
      maximum: 7,
      options: enumOptions(ARDUCOPTER_BATTERY_FAILSAFE_ACTION_LABELS)
    },
    ATC_INPUT_TC: {
      id: 'ATC_INPUT_TC',
      label: 'Stick Feel Smoothing',
      description: 'Input shaping time constant for roll and pitch demand. Lower values feel crisper; higher values feel softer.',
      category: 'tuning',
      unit: 's',
      minimum: 0,
      maximum: 1,
      step: 0.01,
      notes: flightFeelNotes
    },
    ANGLE_MAX: {
      id: 'ANGLE_MAX',
      label: 'Max Lean Angle',
      description: 'Maximum commanded lean angle in self-leveling modes.',
      category: 'tuning',
      unit: 'cdeg',
      minimum: 1000,
      maximum: 8000,
      step: 100,
      notes: ['This value is stored in centidegrees. A value of 4500 means 45 degrees of maximum lean.', ...flightFeelNotes]
    },
    PILOT_Y_RATE: {
      id: 'PILOT_Y_RATE',
      label: 'Yaw Rate',
      description: 'Maximum yaw rate command used for pilot input outside acro tuning.',
      category: 'tuning',
      unit: 'deg/s',
      minimum: 1,
      maximum: 500,
      step: 1,
      notes: flightFeelNotes
    },
    PILOT_Y_EXPO: {
      id: 'PILOT_Y_EXPO',
      label: 'Yaw Expo',
      description: 'Softens yaw response near center stick while preserving full authority at the ends.',
      category: 'tuning',
      minimum: 0,
      maximum: 1,
      step: 0.01,
      notes: flightFeelNotes
    },
    FLTMODE1: {
      id: 'FLTMODE1',
      label: 'Flight Mode 1',
      description: 'Mode assigned to the first switch position.',
      category: 'modes',
      options: enumOptions(ARDUCOPTER_FLIGHT_MODE_LABELS)
    },
    FLTMODE2: {
      id: 'FLTMODE2',
      label: 'Flight Mode 2',
      description: 'Mode assigned to the second switch position.',
      category: 'modes',
      options: enumOptions(ARDUCOPTER_FLIGHT_MODE_LABELS)
    },
    FLTMODE3: {
      id: 'FLTMODE3',
      label: 'Flight Mode 3',
      description: 'Mode assigned to the third switch position.',
      category: 'modes',
      options: enumOptions(ARDUCOPTER_FLIGHT_MODE_LABELS)
    },
    FLTMODE4: {
      id: 'FLTMODE4',
      label: 'Flight Mode 4',
      description: 'Mode assigned to the fourth switch position.',
      category: 'modes',
      options: enumOptions(ARDUCOPTER_FLIGHT_MODE_LABELS)
    },
    FLTMODE5: {
      id: 'FLTMODE5',
      label: 'Flight Mode 5',
      description: 'Mode assigned to the fifth switch position.',
      category: 'modes',
      options: enumOptions(ARDUCOPTER_FLIGHT_MODE_LABELS)
    },
    FLTMODE6: {
      id: 'FLTMODE6',
      label: 'Flight Mode 6',
      description: 'Mode assigned to the sixth switch position.',
      category: 'modes',
      options: enumOptions(ARDUCOPTER_FLIGHT_MODE_LABELS)
    },
    FS_THR_ENABLE: {
      id: 'FS_THR_ENABLE',
      label: 'Throttle Failsafe',
      description: 'Throttle failsafe enable behavior.',
      category: 'failsafe',
      minimum: 0,
      maximum: 7,
      options: enumOptions(ARDUCOPTER_THROTTLE_FAILSAFE_LABELS)
    },
    RCMAP_ROLL: {
      id: 'RCMAP_ROLL',
      label: 'Roll Channel Map',
      description: 'Receiver channel mapped to roll input.',
      category: 'radio',
      minimum: 1,
      maximum: 16,
      step: 1,
      rebootRequired: true,
      notes: rcMapNotes
    },
    RCMAP_PITCH: {
      id: 'RCMAP_PITCH',
      label: 'Pitch Channel Map',
      description: 'Receiver channel mapped to pitch input.',
      category: 'radio',
      minimum: 1,
      maximum: 16,
      step: 1,
      rebootRequired: true,
      notes: rcMapNotes
    },
    RCMAP_THROTTLE: {
      id: 'RCMAP_THROTTLE',
      label: 'Throttle Channel Map',
      description: 'Receiver channel mapped to throttle input.',
      category: 'radio',
      minimum: 1,
      maximum: 16,
      step: 1,
      rebootRequired: true,
      notes: rcMapNotes
    },
    RCMAP_YAW: {
      id: 'RCMAP_YAW',
      label: 'Yaw Channel Map',
      description: 'Receiver channel mapped to yaw input.',
      category: 'radio',
      minimum: 1,
      maximum: 16,
      step: 1,
      rebootRequired: true,
      notes: rcMapNotes
    },
    RC1_MIN: {
      id: 'RC1_MIN',
      label: 'RC1 Minimum',
      description: 'Minimum calibrated value for roll input.',
      category: 'radio',
      minimum: 800,
      maximum: 2200,
      step: 1,
      notes: rcEndpointNotes
    },
    RC1_MAX: {
      id: 'RC1_MAX',
      label: 'RC1 Maximum',
      description: 'Maximum calibrated value for roll input.',
      category: 'radio',
      minimum: 800,
      maximum: 2200,
      step: 1,
      notes: rcEndpointNotes
    },
    RC1_TRIM: {
      id: 'RC1_TRIM',
      label: 'RC1 Trim',
      description: 'Center trim value for roll input.',
      category: 'radio',
      minimum: 800,
      maximum: 2200,
      step: 1,
      notes: rcEndpointNotes
    },
    RC2_MIN: {
      id: 'RC2_MIN',
      label: 'RC2 Minimum',
      description: 'Minimum calibrated value for pitch input.',
      category: 'radio',
      minimum: 800,
      maximum: 2200,
      step: 1,
      notes: rcEndpointNotes
    },
    RC2_MAX: {
      id: 'RC2_MAX',
      label: 'RC2 Maximum',
      description: 'Maximum calibrated value for pitch input.',
      category: 'radio',
      minimum: 800,
      maximum: 2200,
      step: 1,
      notes: rcEndpointNotes
    },
    RC2_TRIM: {
      id: 'RC2_TRIM',
      label: 'RC2 Trim',
      description: 'Center trim value for pitch input.',
      category: 'radio',
      minimum: 800,
      maximum: 2200,
      step: 1,
      notes: rcEndpointNotes
    },
    RC3_MIN: {
      id: 'RC3_MIN',
      label: 'RC3 Minimum',
      description: 'Minimum calibrated value for throttle input.',
      category: 'radio',
      minimum: 800,
      maximum: 2200,
      step: 1,
      notes: rcEndpointNotes
    },
    RC3_MAX: {
      id: 'RC3_MAX',
      label: 'RC3 Maximum',
      description: 'Maximum calibrated value for throttle input.',
      category: 'radio',
      minimum: 800,
      maximum: 2200,
      step: 1,
      notes: rcEndpointNotes
    },
    RC3_TRIM: {
      id: 'RC3_TRIM',
      label: 'RC3 Trim',
      description: 'Center trim value for throttle input.',
      category: 'radio',
      minimum: 800,
      maximum: 2200,
      step: 1,
      notes: rcEndpointNotes
    },
    RC4_MIN: {
      id: 'RC4_MIN',
      label: 'RC4 Minimum',
      description: 'Minimum calibrated value for yaw input.',
      category: 'radio',
      minimum: 800,
      maximum: 2200,
      step: 1,
      notes: rcEndpointNotes
    },
    RC4_MAX: {
      id: 'RC4_MAX',
      label: 'RC4 Maximum',
      description: 'Maximum calibrated value for yaw input.',
      category: 'radio',
      minimum: 800,
      maximum: 2200,
      step: 1,
      notes: rcEndpointNotes
    },
    RC4_TRIM: {
      id: 'RC4_TRIM',
      label: 'RC4 Trim',
      description: 'Center trim value for yaw input.',
      category: 'radio',
      minimum: 800,
      maximum: 2200,
      step: 1,
      notes: rcEndpointNotes
    },
    ACRO_RP_RATE: {
      id: 'ACRO_RP_RATE',
      label: 'Acro Roll/Pitch Rate',
      description: 'Maximum roll and pitch rate used in Acro mode.',
      category: 'acro',
      unit: 'deg/s',
      minimum: 1,
      maximum: 1080,
      step: 1,
      notes: acroRateNotes
    },
    ACRO_Y_RATE: {
      id: 'ACRO_Y_RATE',
      label: 'Acro Yaw Rate',
      description: 'Maximum yaw rate used in Acro mode.',
      category: 'acro',
      unit: 'deg/s',
      minimum: 1,
      maximum: 1080,
      step: 1,
      notes: acroRateNotes
    },
    ACRO_RP_EXPO: {
      id: 'ACRO_RP_EXPO',
      label: 'Acro Roll/Pitch Expo',
      description: 'Softens roll and pitch response near center stick in Acro mode.',
      category: 'acro',
      minimum: 0,
      maximum: 1,
      step: 0.01,
      notes: acroRateNotes
    },
    ACRO_Y_EXPO: {
      id: 'ACRO_Y_EXPO',
      label: 'Acro Yaw Expo',
      description: 'Softens yaw response near center stick in Acro mode.',
      category: 'acro',
      minimum: 0,
      maximum: 1,
      step: 0.01,
      notes: acroRateNotes
    },
    MOT_PWM_TYPE: {
      id: 'MOT_PWM_TYPE',
      label: 'Motor PWM Type',
      description: 'Motor output protocol for ESC communication.',
      category: 'outputs',
      minimum: 0,
      maximum: 8,
      rebootRequired: true,
      notes: [
        'DShot-based protocols do not use the normal all-at-once PWM ESC calibration flow.',
        'After changing the motor output protocol, reboot and repeat output verification before flight.'
      ],
      options: enumOptions(ARDUCOPTER_MOT_PWM_TYPE_LABELS)
    },
    MOT_PWM_MIN: {
      id: 'MOT_PWM_MIN',
      label: 'Motor PWM Minimum',
      description: 'Minimum PWM value sent to the ESCs when using PWM-based protocols.',
      category: 'outputs',
      minimum: 0,
      maximum: 2200,
      step: 1,
      notes: ['Review with the ESC calibration workflow whenever analog PWM endpoints change.']
    },
    MOT_PWM_MAX: {
      id: 'MOT_PWM_MAX',
      label: 'Motor PWM Maximum',
      description: 'Maximum PWM value sent to the ESCs when using PWM-based protocols.',
      category: 'outputs',
      minimum: 0,
      maximum: 2200,
      step: 1,
      notes: ['Review with the ESC calibration workflow whenever analog PWM endpoints change.']
    },
    MOT_SPIN_ARM: {
      id: 'MOT_SPIN_ARM',
      label: 'Motor Spin Armed',
      description: 'Motor output fraction used immediately after arming.',
      category: 'outputs',
      minimum: 0,
      maximum: 1,
      step: 0.01,
      notes: ['Review spin thresholds after ESC calibration or protocol changes.']
    },
    MOT_SPIN_MIN: {
      id: 'MOT_SPIN_MIN',
      label: 'Motor Spin Minimum',
      description: 'Lowest stabilized motor output fraction during flight.',
      category: 'outputs',
      minimum: 0,
      maximum: 1,
      step: 0.01,
      notes: ['This should stay above MOT_SPIN_ARM for a clean idle-to-flight transition.']
    },
    MOT_SPIN_MAX: {
      id: 'MOT_SPIN_MAX',
      label: 'Motor Spin Maximum',
      description: 'Highest allowed motor output fraction.',
      category: 'outputs',
      minimum: 0,
      maximum: 1,
      step: 0.01,
      notes: ['Leave headroom below 1.0 if the propulsion setup saturates early.']
    },
    SERVO1_FUNCTION: {
      id: 'SERVO1_FUNCTION',
      label: 'Output 1 Function',
      description: 'Assigned function for output channel 1.',
      category: 'outputs',
      notes: ['After remapping outputs, confirm the new assignment with a guarded motor or output review before flight.'],
      options: enumOptions(ARDUCOPTER_SERVO_FUNCTION_LABELS)
    },
    SERVO2_FUNCTION: {
      id: 'SERVO2_FUNCTION',
      label: 'Output 2 Function',
      description: 'Assigned function for output channel 2.',
      category: 'outputs',
      notes: ['After remapping outputs, confirm the new assignment with a guarded motor or output review before flight.'],
      options: enumOptions(ARDUCOPTER_SERVO_FUNCTION_LABELS)
    },
    SERVO3_FUNCTION: {
      id: 'SERVO3_FUNCTION',
      label: 'Output 3 Function',
      description: 'Assigned function for output channel 3.',
      category: 'outputs',
      notes: ['After remapping outputs, confirm the new assignment with a guarded motor or output review before flight.'],
      options: enumOptions(ARDUCOPTER_SERVO_FUNCTION_LABELS)
    },
    SERVO4_FUNCTION: {
      id: 'SERVO4_FUNCTION',
      label: 'Output 4 Function',
      description: 'Assigned function for output channel 4.',
      category: 'outputs',
      notes: ['After remapping outputs, confirm the new assignment with a guarded motor or output review before flight.'],
      options: enumOptions(ARDUCOPTER_SERVO_FUNCTION_LABELS)
    },
    SERVO5_FUNCTION: {
      id: 'SERVO5_FUNCTION',
      label: 'Output 5 Function',
      description: 'Assigned function for output channel 5.',
      category: 'outputs',
      notes: ['After remapping outputs, confirm the new assignment with a guarded motor or output review before flight.'],
      options: enumOptions(ARDUCOPTER_SERVO_FUNCTION_LABELS)
    },
    SERVO6_FUNCTION: {
      id: 'SERVO6_FUNCTION',
      label: 'Output 6 Function',
      description: 'Assigned function for output channel 6.',
      category: 'outputs',
      notes: ['After remapping outputs, confirm the new assignment with a guarded motor or output review before flight.'],
      options: enumOptions(ARDUCOPTER_SERVO_FUNCTION_LABELS)
    },
    SERVO7_FUNCTION: {
      id: 'SERVO7_FUNCTION',
      label: 'Output 7 Function',
      description: 'Assigned function for output channel 7.',
      category: 'outputs',
      notes: ['After remapping outputs, confirm the new assignment with a guarded motor or output review before flight.'],
      options: enumOptions(ARDUCOPTER_SERVO_FUNCTION_LABELS)
    },
    SERVO8_FUNCTION: {
      id: 'SERVO8_FUNCTION',
      label: 'Output 8 Function',
      description: 'Assigned function for output channel 8.',
      category: 'outputs',
      notes: ['After remapping outputs, confirm the new assignment with a guarded motor or output review before flight.'],
      options: enumOptions(ARDUCOPTER_SERVO_FUNCTION_LABELS)
    },
    SERVO9_FUNCTION: {
      id: 'SERVO9_FUNCTION',
      label: 'Output 9 Function',
      description: 'Assigned function for output channel 9.',
      category: 'outputs',
      notes: ['After remapping outputs, confirm the new assignment with a guarded motor or output review before flight.'],
      options: enumOptions(ARDUCOPTER_SERVO_FUNCTION_LABELS)
    },
    SERVO10_FUNCTION: {
      id: 'SERVO10_FUNCTION',
      label: 'Output 10 Function',
      description: 'Assigned function for output channel 10.',
      category: 'outputs',
      notes: ['After remapping outputs, confirm the new assignment with a guarded motor or output review before flight.'],
      options: enumOptions(ARDUCOPTER_SERVO_FUNCTION_LABELS)
    },
    SERVO11_FUNCTION: {
      id: 'SERVO11_FUNCTION',
      label: 'Output 11 Function',
      description: 'Assigned function for output channel 11.',
      category: 'outputs',
      notes: ['After remapping outputs, confirm the new assignment with a guarded motor or output review before flight.'],
      options: enumOptions(ARDUCOPTER_SERVO_FUNCTION_LABELS)
    },
    SERVO12_FUNCTION: {
      id: 'SERVO12_FUNCTION',
      label: 'Output 12 Function',
      description: 'Assigned function for output channel 12.',
      category: 'outputs',
      notes: ['After remapping outputs, confirm the new assignment with a guarded motor or output review before flight.'],
      options: enumOptions(ARDUCOPTER_SERVO_FUNCTION_LABELS)
    }
  },
  setupSections: [
    {
      id: 'link',
      title: 'Vehicle Link',
      description: 'Bring the vehicle online and pull the first parameter snapshot.',
      requiredParameters: [],
      actions: ['request-parameters']
    },
    {
      id: 'airframe',
      title: 'Airframe',
      description: 'Verify the frame class and geometry before motor output setup.',
      requiredParameters: ['FRAME_CLASS', 'FRAME_TYPE']
    },
    {
      id: 'outputs',
      title: 'Outputs',
      description: 'Review the primary motor and peripheral output assignments before any props-on testing.',
      requiredParameters: ['SERVO1_FUNCTION', 'SERVO2_FUNCTION', 'SERVO3_FUNCTION', 'SERVO4_FUNCTION'],
      sessionOverrides: {
        'usb-bench': {
          notes: ['USB-only bench session: output review is configuration-only. Keep props removed for any later output testing.']
        }
      }
    },
    {
      id: 'accelerometer',
      title: 'Accelerometer Calibration',
      description: 'Complete IMU calibration before tuning or arming.',
      requiredParameters: ['AHRS_ORIENTATION'],
      completionStatusTexts: ['Accelerometer calibration complete.'],
      actions: ['calibrate-accelerometer']
    },
    {
      id: 'compass',
      title: 'Compass Calibration',
      description: 'Confirm the compass is enabled and calibrated.',
      requiredParameters: ['COMPASS_USE'],
      completionStatusTexts: ['Compass calibration complete.'],
      sessionOverrides: {
        'usb-bench': {
          notes: ['USB-only bench session: external compass hardware may be unpowered, so final sensor verification may still need full vehicle power.']
        }
      },
      actions: ['calibrate-compass']
    },
    {
      id: 'radio',
      title: 'Radio',
      description: 'Inspect primary RC channel calibration.',
      requiredParameters: [
        'RCMAP_ROLL',
        'RCMAP_PITCH',
        'RCMAP_THROTTLE',
        'RCMAP_YAW',
        'RC1_MIN',
        'RC1_MAX',
        'RC1_TRIM',
        'RC2_MIN',
        'RC2_MAX',
        'RC2_TRIM',
        'RC3_MIN',
        'RC3_MAX',
        'RC3_TRIM',
        'RC4_MIN',
        'RC4_MAX',
        'RC4_TRIM'
      ],
      requiredLiveSignals: ['rc-input'],
      sessionOverrides: {
        'usb-bench': {
          notes: ['USB-only bench session: RC receiver inputs are not treated as verified until the receiver and control link are powered.']
        }
      }
    },
    {
      id: 'failsafe',
      title: 'Failsafe',
      description: 'Review throttle and battery failsafe behavior.',
      requiredParameters: ['FS_THR_ENABLE', 'BATT_FS_LOW_ACT'],
      requiredLiveSignals: ['rc-input', 'battery-telemetry'],
      sessionOverrides: {
        'usb-bench': {
          notes: ['USB-only bench session: throttle and battery failsafe behavior still need live verification with the receiver and battery monitor powered.']
        }
      }
    },
    {
      id: 'modes',
      title: 'Flight Modes',
      description: 'Check the first three mapped flight modes.',
      requiredParameters: ['FLTMODE1', 'FLTMODE2', 'FLTMODE3'],
      requiredLiveSignals: ['rc-input'],
      sessionOverrides: {
        'usb-bench': {
          notes: ['USB-only bench session: flight-mode switch mapping remains unverified until live RC inputs are available.']
        }
      }
    },
    {
      id: 'power',
      title: 'Battery',
      description: 'Validate battery monitoring before flight.',
      requiredParameters: ['BATT_MONITOR', 'BATT_CAPACITY'],
      requiredLiveSignals: ['battery-telemetry'],
      sessionOverrides: {
        'usb-bench': {
          notes: ['USB-only bench session: battery monitor and peripheral power checks are deferred until the flight battery is connected.']
        }
      },
      actions: ['reboot-autopilot']
    }
  ]
}
