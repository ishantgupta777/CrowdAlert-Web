"""Django Views for the api app Images
"""
import subprocess
import os
from uuid import uuid4
import base64
from rest_framework.views import APIView
from django.core.files.storage import FileSystemStorage
from django.conf import settings
from django.http import JsonResponse, HttpResponseBadRequest

STORAGE = settings.FIREBASE.storage()
DB = settings.FIREBASE.database()

class ImagesView(APIView):
    """Images class for API view. Allows users to get urls of an image using
    uuid & upload images to cloud storage by specifying either file object
    or base64 equivalent.
    """

    def get(self, request):
        """Allow users to get the corresponding image url for a given image 
        uuid specified as a GET parameter.

        GET request parameters:
            uuid: uuid of the image whose urls are to be fetched. [Required]
        Arguments:
            request {[type]} -- [ Contains the django request object]
        Returns:
            [HttpResponseBadRequest] -- [If  no uuid GET parameter is provided]
            [JsonResponse] -- [Containing the url & thumbnail url of image]

        """

        uuid = request.GET.get('uuid')
        if not uuid:
            return HttpResponseBadRequest("Bad request: Specify the image uuid")
        url = STORAGE.child('images').child(uuid).get_url('')
        thumbnail_url = STORAGE.child('thumbnails').child(uuid.split('.')[0]+'.svg').get_url('')
        return JsonResponse({'url': url, 'thumbnail': thumbnail_url})

    def post(self, request):
        """Allow users to post images i.e upload images to cloud storage.

        POST request parameters:
            [REQUIRED]
            image: containing a file object for the image to be uploaded
                or
            base64: containig the base64 equivalent of the image to be uploaded

            [OPTIONAL]
            eventId: containg the event id of the event where the image will be
                    rendered
            isTrusted: whether the image came from a trusted source or not


        Arguments:
            request {[type]} -- [ Contains the django request object]

        Returns:
            [HttpResponseBadRequest] -- [If  neither image or base64 parameter 
                                        is provided]
            [JsonResponse] -- [Containing the uuid of image]     
        """

        # Generate uuid for the file. Never trust user.
        name = str(uuid4())

        if request.FILES.get('image', False):            
            uploaded_file = request.FILES['image']
            file_system = FileSystemStorage()
            # save
            file_system.save(name, uploaded_file)
            firebase_name = name + '.' + uploaded_file.name.split('.')[-1]

        elif request.POST.get('base64', False):
            data_uri = request.POST['base64']
            name = str(uuid4())
            img = base64.decodestring(str.encode(data_uri.split(",")[1]))
            with open(name, "wb") as image_file:
                image_file.write(img)
            firebase_name = name + '.jpg'
        else:
            return HttpResponseBadRequest("""Bad request:
                Either base64 or image field should be given""")

        # As our load is small now, we can do this in sequential manner
        # After we get enough traffic we should use a redis based solution.
        # Where an event would be pushed and a job id is to be returned
        # and expose another endpoint where we can check the status
        subprocess.run(['node_modules/.bin/sqip', name, '-o', name+'.svg'])
        # Upload files to Cloud storage
        STORAGE.child('images/' + firebase_name).put(name)
        STORAGE.child('thumbnails/'+name+'.svg').put(name+'.svg')        
        # Remove the uploaded files for two good reasons:
        # Keep our dyno clean
        # remove malicious code before anything wrong goes.
        os.remove(name)
        os.remove(name+'.svg')
        # Update Event if id is given,
        if request.POST.get("eventId", False):
            event_id = request.POST.get("eventId", False)
            is_trusted = request.POST.get('isValid', '') == 'true'
            image_data = {"isNsfw": False, "isTrusted": is_trusted, "uuid": firebase_name}
            DB.child('incidents').child(event_id).child("images").push(image_data)
            print("Image Added")
        # Return file id for future reference
        return JsonResponse({'name': firebase_name})