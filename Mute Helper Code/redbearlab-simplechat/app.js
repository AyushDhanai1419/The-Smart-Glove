

document.addEventListener(
	'deviceready',
	function() { evothings.scriptsLoaded(app.initialize) },
	false);

var app = {};

app.RBL_SERVICE_UUID = '713d0000-503e-4c75-ba94-3148f18d941e';
app.RBL_CHAR_TX_UUID = '713d0002-503e-4c75-ba94-3148f18d941e';
app.RBL_CHAR_RX_UUID = '713d0003-503e-4c75-ba94-3148f18d941e';
app.RBL_TX_UUID_DESCRIPTOR = '00002902-0000-1000-8000-00805f9b34fb';

app.initialize = function()
{
	app.connected = false;
};

app.sendMessage = function()
{
	if (app.connected)
	{
		function onMessageSendSucces()
		{
			console.log('Succeded to send message.');
		}

		function onMessageSendFailure(errorCode)
		{
			// Disconnect and show an error message to the user.
			app.disconnect('Disconnected');

			// Write debug information to console
			console.log('Error - No device connected.');
		};

		// Get message from input
		var message = document.getElementById('messageField').value;

		// Update conversation with message
		app.updateConversation(message, false);

		// Convert message
		var data = new Uint8Array(message.length);

		for (var i = 0, messageLength = message.length;
			i < messageLength;
			i++)
		{
			data[i] = message.charCodeAt(i);
		}

		app.device.writeCharacteristic(
			app.RBL_CHAR_RX_UUID,
			data,
			onMessageSendSucces,
			onMessageSendFailure
		);
	}
	else
	{
		// Disconnect and show an error message to the user.
		app.disconnect('Disconnected');

		// Write debug information to console
		console.log('Error - No device connected.');
	}
};

app.setLoadingLabel = function(message)
{
	console.log(message);
	$('#loadingStatus').text(message);
};

app.connectTo = function(address)
{
	device = app.devices[address];

	$('#loadingView').css('display', 'table');

	app.setLoadingLabel('Trying to connect to ' + device.name);

	function onConnectSuccess(device)
	{

		function onServiceSuccess(device)
		{
			// Application is now connected
			app.connected = true;
			app.device = device;

			console.log('Connected to ' + device.name);

			device.writeDescriptor(
				app.RBL_CHAR_TX_UUID, // Characteristic for accelerometer data
				app.RBL_TX_UUID_DESCRIPTOR, // Configuration descriptor
				new Uint8Array([1,0]),
				function()
				{
					console.log('Status: writeDescriptor ok.');

					$('#loadingView').hide();
					$('#scanResultView').hide();
					$('#conversationView').show();
				},
				function(errorCode)
				{
					// Disconnect and give user feedback.
					app.disconnect('Failed to set descriptor.');

					// Write debug information to console.
					console.log('Error: writeDescriptor: ' + errorCode + '.');
				}
			);

			function failedToEnableNotification(erroCode)
			{
				console.log('BLE enableNotification error: ' + errorCode);
			};

			device.enableNotification(
				app.RBL_CHAR_TX_UUID,
				app.receivedMessage,
				function(errorcode)
				{
					console.log('BLE enableNotification error: ' + errorCode);
				}
			);

			$('#scanResultView').hide();
			$('#conversationView').show();
		}

		function onServiceFailure(errorCode)
		{
			// Disconnect and show an error message to the user.
			app.disconnect('Device is not from RedBearLab');

			// Write debug information to console.
			console.log('Error reading services: ' + errorCode);
		}

		app.setLoadingLabel('Identifying services...');

		// Connect to the appropriate BLE service
		device.readServices(
			[app.RBL_SERVICE_UUID],
			onServiceSuccess,
			onServiceFailure
		);
	}

	function onConnectFailure(errorCode)
	{
		app.disconnect('Disconnected from device');

		// Show an error message to the user
		console.log('Error ' + errorCode);
	}

	// Stop scanning
	evothings.easyble.stopScan();

	// Connect to our device
	console.log('Identifying service for communication');
	device.connect(onConnectSuccess, onConnectFailure);
};

app.startScan = function()
{
	app.disconnect();

	console.log('Scanning started...');

	app.devices = {};

	var htmlString =
		'<img src="img/loader_small.gif" style="display:inline; vertical-align:middle">' +
		'<p style="display:inline">   Scanning...</p>';

	$('#scanResultView').append($(htmlString));

	$('#scanResultView').show();

	function onScanSuccess(device)
	{
		if (device.name != null)
		{
			app.devices[device.address] = device;

			console.log('Found: ' + device.name + ', ' + device.address + ', ' + device.rssi);

			var htmlString =
				'<div class="deviceContainer" onclick="app.connectTo(\'' +
					device.address + '\')">' +
				'<p class="deviceName">' + device.name + '</p>' +
				'<p class="deviceAddress">' + device.address + '</p>' +
				'</div>';

			$('#scanResultView').append($(htmlString));
		}
	};

	function onScanFailure(errorCode)
	{
		// Show an error message to the user
		app.disconnect('Failed to scan for devices.');

		// Write debug information to console.
		console.log('Error ' + errorCode);
	};

	evothings.easyble.reportDeviceOnce(true);
	evothings.easyble.startScan(onScanSuccess, onScanFailure);

	$('#startView').hide();
};

app.receivedMessage = function(data)
{
	if (app.connected)
	{
		// Convert data to String
		var message = String.fromCharCode.apply(null, new Uint8Array(data));

		// Update conversation
		app.updateConversation(message, true);

		console.log('Message received: ' + message);
	}
	else
	{
		// Disconnect and show an error message to the user.
		app.disconnect('Disconnected');

		// Write debug information to console
		console.log('Error - No device connected.');
	}
};

counter_switch = 0;

function change_switch(){
	if(counter_switch < 4){
		counter_switch++;
	}
	else{
		counter_switch = 0;
	}
}

app.updateConversation = function(message, isRemoteMessage)
{
	

	// Insert message into DOM model.
	var timeStamp = new Date().toLocaleString();

	var htmlString =
		'<div class="messageContainer">' +
			'<div class="messageTimestamp">' +
				'<p class="messageTimestamp">' + timeStamp + '</p>' +
			'</div>' +
			'<div class="messageIcon">' +
				'<img class="messageIcon" src="img/' +
					(isRemoteMessage == true ? 'arduino.png' : 'apple.png') + '">' +
			'</div>' +
			'<div class="message">' +
				'<p class="message">' + message +'</p>'+
			'</div>' +
		'</div>';

	//$('#conversation').append($(htmlString));

	//console.log(htmlString);
	//$('#conversation').append($(counter_switch.toString()));


		if(counter_switch == 0){
			//Communication mode

			if(htmlString.indexOf("00000") !== -1){
			}
			else if(htmlString.indexOf("00001") !== -1){
				$('#conversation').append("Good Morning </br>");
			}
			else if(htmlString.indexOf("00010") !== -1){
				$('#conversation').append("Good Afternoon </br>");
			}
			else if(htmlString.indexOf("00100") !== -1){
				$('#conversation').append("Good Evening </br>");
			}
			else if(htmlString.indexOf("00101") !== -1){
				$('#conversation').append("Good Night ");
			}
			else if(htmlString.indexOf("00110") !== -1){
				$('#conversation').append("Thank You ");
			}
			else if(htmlString.indexOf("00111") !== -1){
				$('#conversation').append("I am sorry ");
			}
			else if(htmlString.indexOf("01000") !== -1){
				$('#conversation').append("That sounds great ");
			}
			else if(htmlString.indexOf("01001") !== -1){
				$('#conversation').append("I don't understand");
			}
			else if(htmlString.indexOf("01010") !== -1){
				$('#conversation').append("Can you repeat it? ");
			}
			else if(htmlString.indexOf("01011") !== -1){
				$('#conversation').append("What do you mean?");
			}
			else if(htmlString.indexOf("01100") !== -1){
				$('#conversation').append("Nice to meet you ");
			}
			else if(htmlString.indexOf("01110") !== -1){
				$('#conversation').append("What do you do? ");
			}
			else if(htmlString.indexOf("01101") !== -1){
				$('#conversation').append("Where are you from? ");
			}
			else if(htmlString.indexOf("01111") !== -1){
				$('#conversation').append("How can I help you? ");
			}
			else{
		
			}

			if(htmlString.indexOf("10000") !== -1){
				change_switch();
			}

		}
		
		else if(counter_switch == 1){
			if(htmlString.indexOf("00000") !== -1){
			}
			else if(htmlString.indexOf("00001") !== -1){
				$('#conversation').append("Call Ambulance </br>");
			}
			else if(htmlString.indexOf("00010") !== -1){
				$('#conversation').append("Call Police </br>");
			}
			else if(htmlString.indexOf("00100") !== -1){
				$('#conversation').append("Fire </br>");
			}
			else if(htmlString.indexOf("00101") !== -1){
				$('#conversation').append("Sick ");
			}else if(htmlString.indexOf("00111") !== -1){
				$('#conversation').append("Up ");
			}
			else if(htmlString.indexOf("01000") !== -1){
				$('#conversation').append("Down ");
			}
			else if(htmlString.indexOf("01001") !== -1){
				$('#conversation').append("Over");
			}
			else if(htmlString.indexOf("01010") !== -1){
				$('#conversation').append("Under ");
			}
			else if(htmlString.indexOf("01011") !== -1){
				$('#conversation').append("Outside");
			}
			else if(htmlString.indexOf("01100") !== -1){
				$('#conversation').append("Come ");
			}
			else if(htmlString.indexOf("01110") !== -1){
				$('#conversation').append("Go ");
			}
			else if(htmlString.indexOf("01101") !== -1){
				$('#conversation').append("Stop ");
			}
			else if(htmlString.indexOf("01111") !== -1){
				$('#conversation').append("Wait ");
			}
			else if(htmlString.indexOf("10001") !== -1){
				$('#conversation').append("Hot ");
			}
			else if(htmlString.indexOf("10010") !== -1){
				$('#conversation').append("Stay Calm ");
			}
			else if(htmlString.indexOf("10011") !== -1){
				$('#conversation').append("Wet");
			}
			else if(htmlString.indexOf("10100") !== -1){
				$('#conversation').append("Danger ");
			}
			else if(htmlString.indexOf("10101") !== -1){
				$('#conversation').append("Disaster ");
			}
			else if(htmlString.indexOf("10110") !== -1){
				$('#conversation').append("Thief ");
			}
			else if(htmlString.indexOf("10111") !== -1){
				$('#conversation').append("Help ");
			}
			else if(htmlString.indexOf("11000") !== -1){
				$('#conversation').append("Save Me ");
			}
			else if(htmlString.indexOf("11001") !== -1){
				$('#conversation').append("Justice ");
			}
			else{
		
			}

			if(htmlString.indexOf("10000") !== -1){
				change_switch();
			}
						
		}
		else if(counter_switch == 2){
			if(htmlString.indexOf("00000") !== -1){
			}
			else if(htmlString.indexOf("00001") !== -1){
				$('#conversation').append("My  </br>");
			}
			else if(htmlString.indexOf("00010") !== -1){
				$('#conversation').append("Name </br>");
			}
			else if(htmlString.indexOf("00100") !== -1){
				$('#conversation').append("Thank You </br>");
			}
			else if(htmlString.indexOf("00101") !== -1){
				$('#conversation').append("Please ");
			}else if(htmlString.indexOf("00111") !== -1){
				$('#conversation').append("Deaf ");
			}
			else if(htmlString.indexOf("01000") !== -1){
				$('#conversation').append("Yes ");
			}
			else if(htmlString.indexOf("01001") !== -1){
				$('#conversation').append("Family");
			}
			else if(htmlString.indexOf("01010") !== -1){
				$('#conversation').append("Hospital ");
			}
			else if(htmlString.indexOf("01011") !== -1){
				$('#conversation').append("Operation");
			}
			else if(htmlString.indexOf("01100") !== -1){
				$('#conversation').append("Injection ");
			}
			else if(htmlString.indexOf("01110") !== -1){
				$('#conversation').append("Try ");
			}
			else if(htmlString.indexOf("01101") !== -1){
				$('#conversation').append("Pill ");
			}
			else if(htmlString.indexOf("01111") !== -1){
				$('#conversation').append("Car ");
			}
			else if(htmlString.indexOf("10001") !== -1){
				$('#conversation').append("Accident ");
			}
			else if(htmlString.indexOf("10010") !== -1){
				$('#conversation').append("Walk ");
			}
			else if(htmlString.indexOf("10011") !== -1){
				$('#conversation').append("Sleep");
			}
			else if(htmlString.indexOf("10100") !== -1){
				$('#conversation').append("Jump ");
			}
			else if(htmlString.indexOf("10101") !== -1){
				$('#conversation').append("God ");
			}
			else if(htmlString.indexOf("10110") !== -1){
				$('#conversation').append("Eat ");
			}
			else if(htmlString.indexOf("10111") !== -1){
				$('#conversation').append("Pray ");
			}
			else if(htmlString.indexOf("11000") !== -1){
				$('#conversation').append("Priest ");
			}
			else if(htmlString.indexOf("11001") !== -1){
				$('#conversation').append("Time ");
			}
			else if(htmlString.indexOf("11010") !== -1){
				$('#conversation').append("Jesus ");
			}
			else if(htmlString.indexOf("11011") !== -1){
				$('#conversation').append("Hearing Aid ");
			}else if(htmlString.indexOf("11100") !== -1){
				$('#conversation').append("Feel ");
			}
			else if(htmlString.indexOf("11101") !== -1){
				$('#conversation').append("Suddenly ");
			}
			else if(htmlString.indexOf("11110") !== -1){
				$('#conversation').append("Drink ");
			}
			else{
				
				}
		
			if(htmlString.indexOf("10000") !== -1){
				change_switch();
			}
		}
			else if(counter_switch == 3){
				if(htmlString.indexOf("00000") !== -1){
				}
				else if(htmlString.indexOf("00001") !== -1){
					$('#conversation').append("Monday  </br>");
				}
				else if(htmlString.indexOf("00010") !== -1){
					$('#conversation').append("Tuesday </br>");
				}
				else if(htmlString.indexOf("00100") !== -1){
					$('#conversation').append("Wednesday </br>");
				}
				else if(htmlString.indexOf("00101") !== -1){
					$('#conversation').append("Thursday ");
				}
				else if(htmlString.indexOf("00111") !== -1){
					$('#conversation').append("Saturday ");
				}
				else if(htmlString.indexOf("01000") !== -1){
					$('#conversation').append("Sunday ");
				}
				else if(htmlString.indexOf("01001") !== -1){
					$('#conversation').append("Children");
				}
				else if(htmlString.indexOf("01010") !== -1){
					$('#conversation').append("Phone ");
				}
				else if(htmlString.indexOf("01011") !== -1){
					$('#conversation').append("Jail");
				}
				else if(htmlString.indexOf("01100") !== -1){
					$('#conversation').append("Bath ");
				}
				else if(htmlString.indexOf("01110") !== -1){
					$('#conversation').append("Sorry ");
				}
				else if(htmlString.indexOf("01101") !== -1){
					$('#conversation').append("Money ");
				}
				else if(htmlString.indexOf("01111") !== -1){
					$('#conversation').append("Love ");
				}
				else if(htmlString.indexOf("10000") !== -1){
					$('#conversation').append("No ");
				}
				else if(htmlString.indexOf("10001") !== -1){
					$('#conversation').append("How ");
				}
				else if(htmlString.indexOf("10010") !== -1){
					$('#conversation').append("In ");
				}
				else if(htmlString.indexOf("10011") !== -1){
					$('#conversation').append("Here");
				}
				else if(htmlString.indexOf("10100") !== -1){
					$('#conversation').append("Good ");
				}
				else if(htmlString.indexOf("10101") !== -1){
					$('#conversation').append("Excellent ");
				}
				else if(htmlString.indexOf("10110") !== -1){
					$('#conversation').append("Enjoy ");
				}
				else if(htmlString.indexOf("10111") !== -1){
					$('#conversation').append("Smile ");
				}
				else if(htmlString.indexOf("11000") !== -1){
					$('#conversation').append("School ");
				}
				else if(htmlString.indexOf("11001") !== -1){
					$('#conversation').append("Understand ");
				}
				else if(htmlString.indexOf("11010") !== -1){
					$('#conversation').append("Year ");
				}
				else if(htmlString.indexOf("11011") !== -1){
					$('#conversation').append("White ");
				}
				else if(htmlString.indexOf("11100") !== -1){
					$('#conversation').append("Black ");
				}
				else if(htmlString.indexOf("11101") !== -1){
					$('#conversation').append("Is ");
				}
				else if(htmlString.indexOf("11110") !== -1){
					$('#conversation').append("A ");
				}
			else{
		
			}
			if(htmlString.indexOf("10000") !== -1){
				change_switch();
			}
		}
		else if(counter_switch == 4){
			if(htmlString.indexOf("00000") !== -1){
			}
			else if(htmlString.indexOf("00001") !== -1){
				$('#conversation').append("A  </br>");
			}
			else if(htmlString.indexOf("00010") !== -1){
				$('#conversation').append("B </br>");
			}
			else if(htmlString.indexOf("00100") !== -1){
				$('#conversation').append("B </br>");
			}
			else if(htmlString.indexOf("00101") !== -1){
				$('#conversation').append("D ");
			}
			else if(htmlString.indexOf("00111") !== -1){
				$('#conversation').append("F ");
			}
			else if(htmlString.indexOf("01000") !== -1){
				$('#conversation').append("G ");
			}
			else if(htmlString.indexOf("01001") !== -1){
				$('#conversation').append("H");
			}
			else if(htmlString.indexOf("01010") !== -1){
				$('#conversation').append("I ");
			}
			else if(htmlString.indexOf("01011") !== -1){
				$('#conversation').append("J");
			}
			else if(htmlString.indexOf("01100") !== -1){
				$('#conversation').append("K ");
			}
			else if(htmlString.indexOf("01110") !== -1){
				$('#conversation').append("M ");
			}
			else if(htmlString.indexOf("01101") !== -1){
				$('#conversation').append("L ");
			}
			else if(htmlString.indexOf("01111") !== -1){
				$('#conversation').append("N ");
			}
			else if(htmlString.indexOf("10001") !== -1){
				$('#conversation').append("P ");
			}
			else if(htmlString.indexOf("10010") !== -1){
				$('#conversation').append("Q ");
			}
			else if(htmlString.indexOf("10011") !== -1){
				$('#conversation').append("R");
			}
			else if(htmlString.indexOf("10100") !== -1){
				$('#conversation').append("S ");
			}
			else if(htmlString.indexOf("10101") !== -1){
				$('#conversation').append("T ");
			}
			else if(htmlString.indexOf("10110") !== -1){
				$('#conversation').append("U ");
			}
			else if(htmlString.indexOf("10111") !== -1){
				$('#conversation').append("V ");
			}
			else if(htmlString.indexOf("11000") !== -1){
				$('#conversation').append("W ");
			}
			else if(htmlString.indexOf("11001") !== -1){
				$('#conversation').append("X ");
			}
			else if(htmlString.indexOf("11010") !== -1){
				$('#conversation').append("Y ");
			}
			else if(htmlString.indexOf("11011") !== -1){
				$('#conversation').append("Z ");
			}
		else{

		}
		if(htmlString.indexOf("10000") !== -1){
			change_switch();
		}
	}

	// $('html,body').animate(
	// 	{
	// 		scrollTop: $('#disconnectButton').offset().top
	// 	},
	// 	'slow'
	// );
};

app.disconnect = function(errorMessage)
{
	if (errorMessage)
	{
		navigator.notification.alert(errorMessage, function() {});
	}

	app.connected = false;
	app.device = null;

	// Stop any ongoing scan and close devices.
	evothings.easyble.stopScan();
	evothings.easyble.closeConnectedDevices();

	console.log('Disconnected');

	$('#loadingView').hide();
	$('#scanResultView').hide();
	$('#scanResultView').empty();
	$('#conversation').empty();
	$('#conversationView').hide();

	$('#startView').show();
};
