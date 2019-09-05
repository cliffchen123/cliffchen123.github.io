(function() {
	function initOutput(imgW,imgH){
		$('#output').remove();
		$('#outputdiv').append("<canvas id='output' ></canvas>");
		$('#output').attr('width',imgW);
		$('#output').attr('height',imgH);
	}

	function initWave(imgW,imgH){
		$('#wave').remove();
		$('#wavediv').append("<canvas id='wave' ></canvas>");
		$('#wave').attr('width',imgW);
		$('#wave').attr('height',imgH);	
	}

	function initProcessing(imgW,imgH){
		$('#processing').remove();
		$('#processingdiv').append("<canvas id='processing' ></canvas>");
		$('#processing').attr('width',imgW);
		$('#processing').attr('height',imgH);	
	}		

	function showWave(wave,average){
		initWave(700,500);
		var label=[];
		label[0]='0';
		label[wave.length-1]='180';
		var data = {
			labels: label,
			datasets: [
				{
					label: "wave",
					backgroundColor: 'rgba(0, 0, 0, 1)',
					data: wave
				},
				{
					label: "average",
					backgroundColor: 'rgba(255, 0, 0, 1)',
					data: [average]
				}
			]
		};
		var m = document.getElementById('wave');
		ctx= m.getContext('2d');		
		var myBarChart = new Chart(ctx, {
			type: 'bar',
			data: data
		});
		$('#wave').css('display','');
	}
	c=null;
	var r;
	var img;
	imgW=0, imgH=0;
	var gaussianEnergy = 50;
	var videoBtnState = 'stop';
	var autoFingerCounting;
	whiteBackground=null;
	window.onload = function(){
		//init
		var canvas = document.getElementById("input");
		var ctx = canvas.getContext("2d");
		ctx.font = "30px Arial";
		ctx.fillText("please input image",25,80);
		var canvas = document.getElementById("output");
		var ctx = canvas.getContext("2d");
		ctx.font = "30px Arial";
		ctx.fillText("please input image",25,80);	

		
		$('#processingdiv').hide();
		$('#wavediv').hide();
		$('button').click(function(){
			$('#processingdiv').hide();
			$('#wavediv').hide();
		});
	
		//Output image file
		function download() {
			var canvas = document.getElementById('output');
			var dt = canvas.toDataURL('image/bmp');
			this.href = dt;
		};
		downloadLnk.addEventListener('click', download, false);	
		
		//Finger Counting
		$('#gesture').click(function(){
			$('#processingdiv').show();
			$('#wavediv').show();
			initProcessing(imgW,imgH);
			initOutput(150,150);
			var m = document.getElementById('processing');
			d= m.getContext('2d');
			var s = c.getImageData(0,0,imgW,imgH);
			r = d.createImageData(imgW,imgH);

			var predict_number, wave, average
			[predict_number, wave, average] = fingerCount(s, r)

			//show processing image
			d.putImageData(r,0,0);
			
			//show wave
			showWave(wave, average)
			
			var m1 = document.getElementById('output');
			var ctx1 = m1.getContext("2d");
			ctx1.clearRect(0, 0, m1.width, m1.height);
			ctx1.font = "100px Arial";
			ctx1.fillText(""+predict_number,50,115);
		});

		// Video
		video = document.getElementById('video');
		startbutton = document.getElementById('startbutton');
		navigator.mediaDevices.getUserMedia({video: true, audio: false})
		.then(function(stream) {
			video.srcObject = stream;
			video.play();	  
		})
		.catch(function(err) {
			console.log("An error occurred: " + err);
		});



		// video button
		startbutton.addEventListener('click', function(ev){
			// auto finger counting in video
			var mog2 = new cv.BackgroundSubtractorMOG2()
			if(videoBtnState=='stop'){
				// create a white background
				$('#input').attr('width',video.videoWidth);
				$('#input').attr('height',video.videoHeight);
				var canvas = document.getElementById("input");
				var ctx = canvas.getContext("2d");
				ctx.fillStyle = "white";
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				whiteBackground = cv.imread(canvas);

				// create face detection model
				let classifier = new cv.CascadeClassifier();  // initialize classifier
				let utils = new Utils('errorMessage'); //use utils class
				let faceCascadeFile = 'haarcascade_frontalface_default.xml'; // path to xml
				utils.createFileFromUrl(faceCascadeFile, faceCascadeFile, () => { // use createFileFromUrl to "pre-build" the xml
				    classifier.load(faceCascadeFile); // in the callback, load the cascade from file 
				});


				// create auto recognition routine
				autoFingerCounting = setInterval(function(){
					$('#processingdiv').show();
					$('#wavediv').show();
					initProcessing(imgW,imgH);
					initOutput(150,150);
					var m = document.getElementById('input');
					c = m.getContext('2d');
					m.width = video.videoWidth;
					m.height = video.videoHeight;
					c.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
					imgH = m.height;
					imgW = m.width;

					var m = document.getElementById('processing');
					d= m.getContext('2d');
					var s = c.getImageData(0,0,imgW,imgH);
					r = d.createImageData(imgW,imgH);
				



					// face detection
					var m = document.getElementById('input');
					s=cv.imread(m);
					face = faceDetection(s,classifier)
					cv.imshow(m, face);


					// remove background
					// var m = document.getElementById('input');
					// s=cv.imread(m);
					moving = removeBackground(face,mog2);
					cv.imshow(m, moving);

					// posprocess
					// var m = document.getElementById('input');
					// s=cv.imread(m)
					// cv.threshold(s, s, 90, 255, cv.THRESH_BINARY)
					// cv.imshow(m, s)


					// finger count
					var predict_number, wave, average
					[predict_number, wave, average] = fingerCount(moving, r)

					// show processing image
					d.putImageData(r,0,0);

					// show wave
					// showWave(wave, average)

					// show predict number
					var m1 = document.getElementById('output');
					var ctx1 = m1.getContext("2d");
					ctx1.clearRect(0, 0, m1.width, m1.height);
					ctx1.font = "100px Arial";
					ctx1.fillText(""+predict_number,50,115);
				},1000);
				videoBtnState='running';			
			}
			else{
				clearInterval(autoFingerCounting);
				videoBtnState='stop';
			}
						
		}, false);


	}


    $("#uploadImage").change(function(){
      readImage( this );
    });
 
    function readImage(input) {
      if ( input.files && input.files[0] ) {
        var FR= new FileReader();
        FR.onload = function(e) {
			var m = document.getElementById('input');
			c = m.getContext('2d');
			img = new Image();
			img.src = e.target.result;
			img.onload = function(){
				imgH = img.height;
				imgW = img.width;
				$('#input').attr('width',imgW)
				$('#input').attr('height',imgH)
				$('#output').attr('width',imgW)
				$('#output').attr('height',imgH)				
				c.drawImage(img,0,0);
			}		  
        };       
        FR.readAsDataURL( input.files[0] );
      }
	  
    }
})();