puf.zip:
	curl https://www.cms.gov/Research-Statistics-Data-and-Systems/Statistics-Trends-and-Reports/BSAPUFS/Downloads/2010_PD_Profiles_PUF.zip -o puf.zip

2010_PD_Profiles_PUF.csv: puf.zip
	unzip puf.zip
	touch 2010_PD_Profiles_PUF.csv

clean:
	rm puf.zip

