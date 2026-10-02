"use strict";

/*
  DAVID_AI BACKEND
  Vercel Serverless Function
  Path: /api
*/

const MODEL = process.env.OPENAI_MODEL || "gpt-6-luna";
const OPENAI_URL = "https://api.openai.com/v1/responses";

const MAX_BODY = 16000;
const MAX_PROMPT = 8000;
const MAX_STATE = 14000;

const DEPARTMENTS = {
  CSE: [
    "CPU","GPU","RAM","ROM","Microcontroller","Microprocessor","FPGA",
    "PLC","Network Switch","Router","Wi-Fi Module","Bluetooth Module",
    "Sensor Node","Database Node","AI Accelerator","Camera Module",
    "SSD","HDD","Display","Keyboard","Mouse","Servo Controller",
    "Motor Controller","Embedded Controller","Ethernet Module","USB Module",
    "Raspberry Pi","Development Board","Logic Controller",
    "Power Supply Module"
  ],

  EEE: [
    "Battery","DC Motor","AC Motor","Generator","Transformer","Relay",
    "Contactor","Switch","Fuse","Resistor","Potentiometer","Capacitor",
    "Inductor","Diode","Zener Diode","LED","Bridge Rectifier",
    "Voltage Regulator","Current Sensor","Voltage Sensor","Power Supply",
    "Inverter","Rectifier","Motor Driver","Solenoid","Electromagnetic Coil",
    "Ground","Bus Bar"
  ],

  ECE: [
    "AND Gate","OR Gate","NOT Gate","NAND Gate","NOR Gate","XOR Gate",
    "XNOR Gate","Flip Flop","Counter","ADC","DAC","Op Amp","Comparator",
    "555 Timer","UART","SPI","I2C","CAN Bus","Ethernet","RF Module",
    "GPS Module","Bluetooth Module","Wi-Fi Module","Antenna","Oscillator",
    "Crystal","PLL","PCB","Signal Generator","Oscilloscope"
  ],

  FT: [
    "Food Mixer","Conveyor","Heating Chamber","Cooling Chamber",
    "Temperature Sensor","Pressure Sensor","Flow Sensor","Level Sensor",
    "Pump","Valve","Filter","Reactor","Storage Tank","Feeder","Dryer",
    "Blender","Separator","Packaging Unit","Heat Exchanger",
    "Process Controller"
  ],

  CIVIL: [
    "Beam","Column","Slab","Foundation","Footing","Wall","Road","Bridge",
    "Tunnel","Pipeline","Water Tank","Drainage Pipe","Manhole",
    "Valve Chamber","Retaining Wall","Dam","Canal","Tower","Building",
    "Staircase","Elevator Shaft","Steel Reinforcement","Concrete Block",
    "Survey Point"
  ],

  MECH: [
    "Engine","Gear","Gearbox","Shaft","Bearing","Coupling","Pulley",
    "Belt","Chain","Sprocket","Flywheel","Piston","Cylinder","Crankshaft",
    "Cam","Spring","Damper","Pump","Compressor","Fan","Impeller",
    "Heat Exchanger","Mechanical Joint","Frame","Chassis"
  ],

  AUTOMOBILE: [
    "Engine","Transmission","Clutch","Differential","Drive Shaft","Axle",
    "Wheel","Tire","Brake","Brake Disc","Brake Caliper","Steering",
    "Suspension","Shock Absorber","Radiator","Fuel Tank","Fuel Pump",
    "Alternator","Starter Motor","ECU","ABS Controller","Airbag",
    "Battery","Electric Motor","EV Controller","Charging Port"
  ],

  AEROSPACE: [
    "Aircraft Engine","Jet Turbine","Propeller","Wing","Fuselage","Tail",
    "Rudder","Elevator","Aileron","Landing Gear","Brake System",
    "Fuel Tank","Fuel Pump","Avionics","Flight Controller","GPS","Radar",
    "Communication Module","Navigation System","Pitot Tube","Cabin",
    "Actuator","Hydraulic System","Control Surface"
  ],

  SPACECRAFT: [
    "Rocket Engine","Fuel Tank","Oxidizer Tank","Rocket Body","Payload",
    "Satellite","Solar Panel","Battery","Reaction Wheel","Gyroscope",
    "Star Tracker","GPS Receiver","Telemetry Module","Communication Antenna",
    "Flight Computer","Thruster","Docking Port","Heat Shield","Parachute",
    "Landing Module","Orbital Sensor","Navigation Unit"
  ],

  FLUID: [
    "Pump","Pipe","Valve","Tank","Reservoir","Flow Meter","Pressure Gauge",
    "Pressure Sensor","Flow Sensor","Filter","Compressor",
    "Hydraulic Cylinder","Hydraulic Motor","Manifold","Nozzle","Vent",
    "Heat Exchanger","Fluid Controller"
  ],

  SCIENCE: [
    "Particle","Mass","Force","Velocity","Acceleration","Spring","Pendulum",
    "Magnet","Electric Field","Magnetic Field","Light Source","Lens",
    "Mirror","Prism","Wave Generator","Detector","Sensor","Thermometer",
    "Pressure Chamber","Vacuum Chamber"
  ],

  CHEMISTRY: [
    "Atom","Molecule","Reaction Vessel","Beaker","Flask","Test Tube",
    "Distillation Column","Separator","Reactor","Filter","Pump","Valve",
    "Chemical Tank","Heat Source","Cooler","pH Sensor",
    "Temperature Sensor","Pressure Sensor","Flow Sensor","Catalyst"
  ],

  BIOLOGY: [
    "Cell","Nucleus","DNA","RNA","Protein","Enzyme","Membrane","Microscope",
    "Incubator","Culture Chamber","Bio Reactor","Sensor","Sample Holder",
    "Fluid Chamber","Pump","Filter","Temperature Controller",
    "Imaging Module"
  ],

  NANOTECH: [
    "Nano Sensor","Nano Wire","Nano Tube","Graphene Sheet","Quantum Dot",
    "Nano Particle","Nano Motor","Nano Robot","Nano Material",
    "Nano Electrode","Nano Membrane","Nano Transistor","Nano Battery",
    "Nano Catalyst"
  ],

  QUANTUM: [
    "Qubit","Quantum Gate","Quantum Register","Quantum Sensor",
    "Quantum Processor","Quantum Memory","Photon Source","Photon Detector",
    "Superconducting Circuit","Quantum Interconnect","Quantum Controller",
    "Quantum Measurement"
  ],

  ROBOTICS: [
    "Robot Base","Robot Arm","Servo Motor","Stepper Motor","Motor Driver",
    "Encoder","IMU","Camera","LiDAR","Ultrasonic Sensor","Force Sensor",
    "Gripper","Manipulator","Controller","Battery","Wireless Module",
    "Navigation Module","Obstacle Sensor"
  ],

  RENEWABLE: [
    "Solar Panel","Wind Turbine","Generator","Battery","Inverter",
    "Charge Controller","Hydro Turbine","Hydro Generator","Biogas Reactor",
    "Fuel Cell","Energy Storage","Power Controller","Smart Meter"
  ]
};

const ACTION_TYPES = [
  "add",
  "remove",
  "move",
  "rotate",
  "connect",
  "disconnect",
  "split",
  "fix",
  "duplicate",
  "align",
  "measure",
  "zoom",
  "pan",
  "center",
  "showall",
  "check",
  "run",
  "reset"
];

const ACTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    actions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          type: {
            type: "string",
            enum: ACTION_TYPES
          },

          name: {
            type: ["string", "null"]
          },

          department: {
            type: ["string", "null"]
          },

          source: {
            type: ["string", "null"]
          },

          target: {
            type: ["string", "null"]
          },

          x: {
            type: ["number", "null"]
          },

          y: {
            type: ["number", "null"]
          },

          angle: {
            type: ["number", "null"]
          },

          degrees: {
            type: ["number", "null"]
          },

          factor: {
            type: ["number", "null"]
          },

          value: {
            type: ["number", "null"]
          }
        },

        required: [
          "type",
          "name",
          "department",
          "source",
          "target",
          "x",
          "y",
          "angle",
          "degrees",
          "factor",
          "value"
        ]
      }
    },

    reply: {
      type: "string"
    }
  },

  required: [
    "actions",
    "reply"
  ]
};

const SYSTEM_PROMPT = `
You are the engineering command interpreter for DAVID_AI.

Your job is to convert a user's natural-language engineering/design command
into safe structured visual-engine actions.

The browser application contains a component library covering:

CSE, EEE, ECE, FT, CIVIL, MECH, AUTOMOBILE, AEROSPACE,
SPACECRAFT, FLUID, SCIENCE, CHEMISTRY, BIOLOGY, NANOTECH,
QUANTUM, ROBOTICS and RENEWABLE.

You MUST only use components that exist in the supplied library.

IMPORTANT:

1. Understand complete multi-step commands.

Example:

"Create a motor system with a battery, motor controller and DC motor,
connect the battery to the controller and controller to the motor,
then test it."

Should become approximately:

add Battery
add Motor Controller
add DC Motor
connect Battery -> Motor Controller
connect Motor Controller -> DC Motor
check
run

2. "import X" means add the component to the visual engine.

3. "add X" means add the component.

4. "create X" means add the component.

5. "connect X to Y" means create a graph connection from X to Y.

6. "connect it to Y" means use the most recently created/selected
component as the source.

7. "disconnect X from Y" removes the graph connection.

8. "remove X" removes X.

9. "delete X" removes X.

10. "split X" splits the selected component. If X is not specified,
split the selected component.

11. "rotate X" rotates X. If no component is specified,
rotate the selected component.

12. "lock X" or "fix X" fixes the selected component.

13. "duplicate X" duplicates the component.

14. "test", "check", or "validate" produces a conceptual structural check.

15. "run" or "simulate" starts a conceptual simulation.

16. "show all" or "fit view" centers the design.

17. "zoom in" uses a factor greater than 1.

18. "zoom out" uses a factor below 1.

19. "measure X to Y" produces a visual distance measurement.

20. "align" aligns the current model.

21. Preserve command order.

22. Multiple commands in one sentence must result in multiple actions.

23. Do not invent physical measurements or claim real hardware validation.

24. The browser performs the actual visual operations.
You only return structured actions.

25. Never return JavaScript.

26. Never return HTML.

27. Never return markdown.

28. Return only the structured function result.

29. If a component is ambiguous, choose the closest exact library
component rather than inventing one.

30. If the user asks for an entire subsystem, create the necessary
library components and reasonable graph connections.

31. Do not claim that a conceptual simulation proves a physical circuit,
mechanical system, aircraft, automobile, civil structure or spacecraft
will work in reality.

32. Keep the reply short and describe what was done.

The application state supplied by the browser represents the current
editable visual model.
`;

function jsonResponse(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

function setSecurityHeaders(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader(
    "Permissions-Policy",
    "camera=(self), microphone=(self), geolocation=()"
  );
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; frame-ancestors 'none'"
  );
}

function getBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", chunk => {
      body += chunk;

      if (body.length > MAX_BODY) {
        reject(new Error("Request too large"));
        req.destroy();
      }
    });

    req.on("end", () => {
      resolve(body);
    });

    req.on("error", reject);
  });
}

function cleanString(value, max = 8000) {
  if (typeof value !== "string") return "";
  return value.slice(0, max);
}

function sanitizeState(state) {
  if (!state || typeof state !== "object") {
    return {};
  }

  const copy = {
    name: cleanString(state.name, 200),
    selected: cleanString(state.selected, 200),
    page: null
  };

  if (state.page && typeof state.page === "object") {
    copy.page = {
      name: cleanString(state.page.name, 200),
      nodes: Array.isArray(state.page.nodes)
        ? state.page.nodes.slice(0, 300).map(n => ({
            id: cleanString(n.id, 100),
            name: cleanString(n.name, 200),
            dept: cleanString(n.dept, 100),
            x: Number.isFinite(Number(n.x))
              ? Number(n.x)
              : 0,
            y: Number.isFinite(Number(n.y))
              ? Number(n.y)
              : 0,
            r: Number.isFinite(Number(n.r))
              ? Number(n.r)
              : 0,
            fixed: Boolean(n.fixed)
          }))
        : [],

      links: Array.isArray(state.page.links)
        ? state.page.links
            .slice(0, 500)
            .map(link => {
              if (!Array.isArray(link)) return [];
              return [
                cleanString(link[0], 100),
                cleanString(link[1], 100)
              ];
            })
        : []
    };
  }

  return copy;
}

function compactLibrary() {
  return Object.entries(DEPARTMENTS)
    .map(([department, components]) => ({
      department,
      components
    }));
}

function buildInput(prompt, state) {
  return [
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text:
            "USER COMMAND:\n" +
            prompt +
            "\n\nCURRENT PROJECT STATE:\n" +
            JSON.stringify(state) +
            "\n\nAVAILABLE LIBRARY:\n" +
            JSON.stringify(compactLibrary())
        }
      ]
    }
  ];
}

function findOutputFunction(response) {
  if (!response || !Array.isArray(response.output)) {
    return null;
  }

  for (const item of response.output) {
    if (
      item &&
      item.type === "function_call"
    ) {
      return item;
    }
  }

  return null;
}

function validateAction(action) {
  if (!action || typeof action !== "object") {
    return false;
  }

  if (!ACTION_TYPES.includes(action.type)) {
    return false;
  }

  if (
    action.name &&
    typeof action.name !== "string"
  ) {
    return false;
  }

  if (
    action.source &&
    typeof action.source !== "string"
  ) {
    return false;
  }

  if (
    action.target &&
    typeof action.target !== "string"
  ) {
    return false;
  }

  return true;
}

function sanitizeActions(actions) {
  if (!Array.isArray(actions)) {
    return [];
  }

  return actions
    .slice(0, 100)
    .filter(validateAction)
    .map(action => ({
      type: action.type,

      name:
        typeof action.name === "string"
          ? action.name.slice(0, 200)
          : null,

      department:
        typeof action.department === "string"
          ? action.department.slice(0, 100)
          : null,

      source:
        typeof action.source === "string"
          ? action.source.slice(0, 200)
          : null,

      target:
        typeof action.target === "string"
          ? action.target.slice(0, 200)
          : null,

      x:
        Number.isFinite(Number(action.x))
          ? Number(action.x)
          : null,

      y:
        Number.isFinite(Number(action.y))
          ? Number(action.y)
          : null,

      angle:
        Number.isFinite(Number(action.angle))
          ? Number(action.angle)
          : null,

      degrees:
        Number.isFinite(Number(action.degrees))
          ? Number(action.degrees)
          : null,

      factor:
        Number.isFinite(Number(action.factor))
          ? Number(action.factor)
          : null,

      value:
        Number.isFinite(Number(action.value))
          ? Number(action.value)
          : null
    }));
}

async function callOpenAI(prompt, state) {

  const key = process.env.OPENAI_API_KEY;

  if (!key) {
    throw new Error(
      "OPENAI_API_KEY is not configured"
    );
  }

  const body = {
    model: MODEL,

    store: false,

    instructions: SYSTEM_PROMPT,

    input: buildInput(
      prompt,
      state
    ),

    tools: [
      {
        type: "function",

        name: "design_actions",

        description:
          "Convert the engineering command into ordered visual design actions.",

        strict: true,

        parameters: ACTION_SCHEMA
      }
    ],

    tool_choice: {
      type: "function",
      name: "design_actions"
    }
  };

  const response =
    await fetch(
      OPENAI_URL,
      {
        method: "POST",

        headers: {
          "Authorization":
            `Bearer ${key}`,

          "Content-Type":
            "application/json"
        },

        body: JSON.stringify(body)
      }
    );

  const raw =
    await response.text();

  if (!response.ok) {

    let message =
      `OpenAI request failed (${response.status})`;

    try {
      const parsed =
        JSON.parse(raw);

      message =
        parsed?.error?.message ||
        message;
    } catch (_) {}

    throw new Error(message);
  }

  let data;

  try {
    data=JSON.parse(raw);
  } catch (_) {
    throw new Error(
      "Invalid response from AI service"
    );
  }

  return data;
}

async function handler(req, res) {

  setSecurityHeaders(res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method === "GET") {

    jsonResponse(
      res,
      200,
      {
        ok: true,
        service: "DAVID_AI",
        model: MODEL,
        endpoint: "/api"
      }
    );

    return;
  }

  if (req.method !== "POST") {

    jsonResponse(
      res,
      405,
      {
        error: "Method not allowed"
      }
    );

    return;
  }

  try {

    const raw =
      await getBody(req);

    let body;

    try {
      body =
        JSON.parse(raw);
    } catch (_) {

      jsonResponse(
        res,
        400,
        {
          error:
            "Request body must be valid JSON"
        }
      );

      return;
    }

    const prompt =
      cleanString(
        body.prompt,
        MAX_PROMPT
      ).trim();

    if (!prompt) {

      jsonResponse(
        res,
        400,
        {
          error:
            "Prompt is required"
        }
      );

      return;
    }

    const safeState =
      sanitizeState(
        body.state
      );

    const stateText =
      JSON.stringify(safeState);

    if (
      stateText.length >
      MAX_STATE
    ) {

      jsonResponse(
        res,
        400,
        {
          error:
            "Project state is too large"
        }
      );

      return;
    }

    const ai =
      await callOpenAI(
        prompt,
        safeState
      );

    const functionCall =
      findOutputFunction(ai);

    if (!functionCall) {

      jsonResponse(
        res,
        502,
        {
          error:
            "AI did not return design actions"
        }
      );

      return;
    }

    let parsed;

    try {
      parsed =
        JSON.parse(
          functionCall.arguments
        );
    } catch (_) {

      jsonResponse(
        res,
        502,
        {
          error:
            "AI returned invalid action JSON"
        }
      );

      return;
    }

    const actions =
      sanitizeActions(
        parsed.actions
      );

    const reply =
      typeof parsed.reply === "string"
        ? parsed.reply.slice(0,1000)
        : "Command processed.";

    jsonResponse(
      res,
      200,
      {
        ok: true,
        reply,
        actions
      }
    );

  } catch (error) {

    console.error(
      "DAVID_AI API ERROR:",
      error
    );

    jsonResponse(
      res,
      500,
      {
        error:
          error.message ||
          "Internal server error"
      }
    );
  }
}

module.exports = handler;
