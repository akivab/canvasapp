from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.ext import db
from google.appengine.ext.webapp import template
import simplejson as json
import os, re


class Image(db.Model):
  name = db.StringProperty()
  image = db.TextProperty()

class PostImage(webapp.RequestHandler):
  def post(self):
    name = self.request.get('name')
    data = self.request.get('data')
    msg = ''
    if data and re.match('data:image', data):
      img = Image.gql('WHERE name=:1', name).get()
      if not img: img = Image()
      img.name = name
      img.image = data
      img.put()
      msg = 'Drawing.alertOk("Added %s")' % name
    else:
      msg = 'Drawing.alertError("Cannot add %s")' % name
    self.response.out.write(msg)

class GetImage(webapp.RequestHandler):
  def get(self):
    name = self.request.get('name')
    data = Image.gql('WHERE name=:1', name).get()
    msg = ''
    if data:
      msg = 'Drawing.handleData(%s)' % json.dumps(data.image)
    else:
      msg = 'Drawing.alertError("Cannot get image %s")' % name
    self.response.out.write(msg)

class MainPage(webapp.RequestHandler):
  def get(self):
    path = os.path.join(os.path.dirname(__file__), 'index.html')
    self.response.out.write(template.render(path, {}))

app = webapp.WSGIApplication([('/get', GetImage),
                              ('/post', PostImage),
                              ('/.*', MainPage),],
                             debug=False)
def main():
  run_wsgi_app(app)

if __name__ == "__main__":
  main()
