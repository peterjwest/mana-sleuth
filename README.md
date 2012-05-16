#An MTG card search App

This app is designed to provide awesome and quick Magic The Gathering card searching.
It scrapes [gatherer](http://gatherer.wizards.com/Pages/Default.aspx), in order to populate a mongo database.
Then it uses (read: will use) some clever tricks to find exactly the cards you want with the minimum hassle.

##TODO

 - Build frontend
 - Finish database saving
 - Better handling of request failure, save failure - logging?
 - Save block/expansion relationships
 - Store images on S3
 - Double update bug for split cards
 - Fix fixture cards overwriting printings
 - Merge promo/special rarities
 - Remove land rarity, colourless colour